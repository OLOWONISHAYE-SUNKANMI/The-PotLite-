import { Router } from "express";
import { z } from "zod";
import {
  registerAdultUser,
  authenticateAdultUser,
  setupTwoFactorForUser,
  enableTwoFactorForUser,
  verifyTOTPCode,
} from "./auth";
import {
  sendTwilioSMSVerification,
  verifyTwilioSMSCode,
} from "./twilio";
import {
  createPotInvitation,
  getInvitationDetails,
  withdrawMemberFromPot,
  recordOfflinePayment,
  confirmOfflinePayment,
  disputeOfflinePayment,
  requestAssistance,
  recordSponsorCoverage,
  requestPayoutSpend,
  approvePayoutSpend,
  markPayoutDisbursed,
  getOrganizerDashboardSummary,
  getMemberDashboardSummary,
} from "./engine";
import {
  createOrganizationWithDefaultRules,
  createTeam,
  registerPlayer,
  createPilotPot,
  acceptObligation,
} from "./core";
import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const thePotLiteRouter = Router();

// Validation Schemas
const registerSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  name: z.string().min(1, "Full name is required"),
  email: z.string().optional().default(""),
  password: z.string().min(4, "Password must be at least 4 characters"),
  phone: z.string().optional().default(""),
  organizationId: z.number().optional().default(1),
  role: z.enum(["Organizer", "Member"]).optional().default("Organizer"),
  title: z.string().optional(),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
  phone: z.string().optional(),
});

const verifyTwoFactorSchema = z.object({
  userId: z.number().optional().default(1),
  code: z.string().length(6, "Code must be 6 digits"),
});

// Helper for error handling
const handleRouteError = (res: any, error: any) => {
  console.error("[thePotLiteRouter error]:", error);
  if (error instanceof z.ZodError || error?.name === "ZodError" || error?.issues) {
    const issues = error.errors || error.issues || [];
    const details = issues.map((e: any) => `${e.path.join(".") || "field"}: ${e.message}`).join("; ") || "Validation error";
    return res.status(400).json({ error: details, details: issues });
  }
  const status = error.statusCode || 400;
  return res.status(status).json({ error: error.message || "An unexpected error occurred" });
};

// ---------------------------------------------------------------------------
// Auth Routes
// ---------------------------------------------------------------------------

thePotLiteRouter.post("/auth/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    let cleanEmail = (data.email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      const sanitizedUser = data.username.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
      cleanEmail = `${sanitizedUser}@thepotlite.org`;
    }

    const user = await registerAdultUser({
      ...data,
      email: cleanEmail,
    });

    if ((req as any).session) (req as any).session.userId = user.id;
    return res.status(201).json({ message: "Registered successfully", user });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/auth/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authenticateAdultUser(data);
    if (result.requiresTwoFactor) {
      return res.status(200).json({
        requiresTwoFactor: true,
        userId: result.userId,
        username: result.username,
        message: "Please enter your 6-digit two-factor authentication code.",
      });
    }
    if ((req as any).session && result.user) (req as any).session.userId = result.user.id;
    return res.status(200).json({
      requiresTwoFactor: false,
      user: result.user,
      message: "Authenticated successfully",
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/auth/2fa/setup", async (req, res) => {
  try {
    const userId = req.body.userId ?? (req as any).session?.userId;
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    const setupData = await setupTwoFactorForUser(Number(userId));
    return res.status(200).json(setupData);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/auth/2fa/enable", async (req, res) => {
  try {
    const { userId, code } = verifyTwoFactorSchema.parse(req.body);
    const result = await enableTwoFactorForUser(userId, code);
    return res.status(200).json({
      message: "Two-factor authentication successfully enabled",
      backupCodes: result.backupCodes,
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/auth/2fa/verify", async (req, res) => {
  try {
    const { userId, code } = verifyTwoFactorSchema.parse(req.body);
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user || !user.twoFactorSecret) return res.status(400).json({ error: "2FA not configured" });
    const isValid = verifyTOTPCode(user.twoFactorSecret, code);
    if (!isValid) return res.status(401).json({ error: "Invalid two-factor authentication code" });
    if ((req as any).session) (req as any).session.userId = user.id;
    return res.status(200).json({
      message: "Two-factor verification successful",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// Twilio SMS 2FA Endpoints
thePotLiteRouter.post("/auth/sms/send", async (req, res) => {
  try {
    const { phone } = z.object({ phone: z.string().min(5) }).parse(req.body);
    const result = await sendTwilioSMSVerification(phone);
    return res.status(200).json(result);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/auth/sms/verify", async (req, res) => {
  try {
    const { phone, code, userId } = z.object({
      phone: z.string().min(5),
      code: z.string().length(6),
      userId: z.number().optional(),
    }).parse(req.body);

    const verification = verifyTwilioSMSCode(phone, code);
    if (!verification.success) {
      return res.status(400).json({ error: verification.error || "Invalid verification code" });
    }

    let user: any = null;
    if (userId) {
      user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
      if (user && (req as any).session) {
        (req as any).session.userId = user.id;
      }
    }

    return res.status(200).json({
      success: true,
      verified: true,
      message: "SMS 2FA verification successful",
      user: user
        ? {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone,
            twoFactorEnabled: user.twoFactorEnabled,
          }
        : undefined,
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.get("/auth/me", async (req, res) => {
  try {
    const userId = (req as any).session?.userId ?? Number(req.query.userId);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user) return res.status(404).json({ error: "User not found" });
    const memberships = await db.query.organizationMembers.findMany({
      where: eq(schema.organizationMembers.userId, user.id),
      with: { organization: true },
    });
    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      memberships: memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organization?.name,
        role: m.role,
        title: m.title,
      })),
    });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/auth/logout", async (req, res) => {
  try {
    if ((req as any).session) {
      (req as any).session.destroy?.();
    }
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/auth/logout", (req, res) => {
  if ((req as any).session) {
    (req as any).session.destroy(() => res.status(200).json({ message: "Logged out" }));
  } else {
    res.status(200).json({ message: "Logged out" });
  }
});

// ---------------------------------------------------------------------------
// Organization & Pot Management
// ---------------------------------------------------------------------------

thePotLiteRouter.post("/organizations", async (req, res) => {
  try {
    const { name, description, sport, createdById } = req.body;
    const result = await createOrganizationWithDefaultRules({
      name,
      description,
      sport,
      createdById: Number(createdById),
    });
    return res.status(201).json(result);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/pots", async (req, res) => {
  try {
    const { organizationId, teamId, name, purpose, potType, goalAmountCents, deadline, createdById } = req.body;
    const pot = await createPilotPot({
      organizationId: Number(organizationId),
      teamId: teamId ? Number(teamId) : undefined,
      name,
      purpose,
      potType,
      goalAmountCents: Number(goalAmountCents),
      deadline: new Date(deadline),
      createdById: Number(createdById),
    });
    return res.status(201).json(pot);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.get("/pots/:id", async (req, res) => {
  try {
    const potId = Number(req.params.id);
    const pot = await db.query.pilotPots.findFirst({
      where: eq(schema.pilotPots.id, potId),
      with: {
        organization: true,
        team: true,
        ruleVersion: true,
        obligations: {
          with: { member: true, player: true, installments: true },
        },
      },
    });
    if (!pot) return res.status(404).json({ error: "Pot not found" });
    return res.status(200).json(pot);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.get("/pots/:id/timeline", async (req, res) => {
  try {
    const potId = Number(req.params.id);
    const events = await db.query.auditEvents.findMany({
      where: eq(schema.auditEvents.potId, potId),
      orderBy: [desc(schema.auditEvents.timestamp)],
      limit: 50,
    });
    return res.status(200).json(events);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// ---------------------------------------------------------------------------
// Invitations & Acceptance
// ---------------------------------------------------------------------------

thePotLiteRouter.post("/invitations", async (req, res) => {
  try {
    const { potId, memberUserId, playerId, totalAmountCents, schedule, createdById, termsText } = req.body;
    const parsedSchedule = (schedule as Array<{ dueDate: string; amountCents: number }>).map((s) => ({
      dueDate: new Date(s.dueDate),
      amountCents: Number(s.amountCents),
    }));

    const result = await createPotInvitation({
      potId: Number(potId),
      memberUserId: Number(memberUserId),
      playerId: playerId ? Number(playerId) : undefined,
      totalAmountCents: Number(totalAmountCents),
      schedule: parsedSchedule,
      createdById: Number(createdById),
      termsText,
    });
    return res.status(201).json(result);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.get("/invitations/:id", async (req, res) => {
  try {
    const obligationId = Number(req.params.id);
    const details = await getInvitationDetails(obligationId);
    return res.status(200).json(details);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/invitations/:id/accept", async (req, res) => {
  try {
    const obligationId = Number(req.params.id);
    const memberUserId = Number(req.body.memberUserId);
    const updated = await acceptObligation({ obligationId, memberUserId });
    return res.status(200).json({ message: "Obligation accepted successfully", obligation: updated });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/invitations/:id/withdraw", async (req, res) => {
  try {
    const obligationId = Number(req.params.id);
    const { memberUserId, reason } = req.body;
    const result = await withdrawMemberFromPot({
      obligationId,
      memberUserId: Number(memberUserId),
      reason,
    });
    return res.status(200).json({ message: "Withdrawn from Pot", result });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// ---------------------------------------------------------------------------
// Offline Payments & Two-Party Confirmation
// ---------------------------------------------------------------------------

thePotLiteRouter.post("/obligations/:id/payments", async (req, res) => {
  try {
    const obligationId = Number(req.params.id);
    const { potId, installmentId, initiatedByUserId, initiatedByRole, payerUserId, amountCents, method, dateSent, referenceNote, statement } = req.body;
    const payment = await recordOfflinePayment({
      potId: Number(potId),
      obligationId,
      installmentId: installmentId ? Number(installmentId) : undefined,
      initiatedByUserId: Number(initiatedByUserId),
      initiatedByRole,
      payerUserId: Number(payerUserId),
      amountCents: Number(amountCents),
      method,
      dateSent: new Date(dateSent || Date.now()),
      referenceNote,
      statement,
    });
    return res.status(201).json(payment);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/payments/:id/confirm", async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    const { confirmingUserId, organizationId } = req.body;
    const confirmed = await confirmOfflinePayment({
      paymentId,
      confirmingUserId: Number(confirmingUserId),
      organizationId: Number(organizationId),
    });
    return res.status(200).json({ message: "Payment confirmed", payment: confirmed });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/payments/:id/dispute", async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    const { disputingUserId, disputeType, counterStatement } = req.body;
    const disputed = await disputeOfflinePayment({
      paymentId,
      disputingUserId: Number(disputingUserId),
      disputeType,
      counterStatement,
    });
    return res.status(200).json({ message: "Payment moved to Disputed", payment: disputed });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// ---------------------------------------------------------------------------
// Assistance & Sponsorship (Yellow Path)
// ---------------------------------------------------------------------------

thePotLiteRouter.post("/obligations/:id/assistance", async (req, res) => {
  try {
    const obligationId = Number(req.params.id);
    const { memberUserId, needType, visibility, proposedNewDate, requestedAmountCents, notes } = req.body;
    const reqRecord = await requestAssistance({
      obligationId,
      memberUserId: Number(memberUserId),
      needType,
      visibility,
      proposedNewDate: proposedNewDate ? new Date(proposedNewDate) : undefined,
      requestedAmountCents: requestedAmountCents ? Number(requestedAmountCents) : undefined,
      notes,
    });
    return res.status(201).json(reqRecord);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/obligations/:id/sponsorship", async (req, res) => {
  try {
    const obligationId = Number(req.params.id);
    const { sponsorUserId, coveredMemberUserId, amountCents, isGift, repaymentAmountCents, repaymentDueDate } = req.body;
    const record = await recordSponsorCoverage({
      obligationId,
      sponsorUserId: Number(sponsorUserId),
      coveredMemberUserId: Number(coveredMemberUserId),
      amountCents: Number(amountCents),
      isGift: Boolean(isGift),
      repaymentAmountCents: repaymentAmountCents ? Number(repaymentAmountCents) : undefined,
      repaymentDueDate: repaymentDueDate ? new Date(repaymentDueDate) : undefined,
    });
    return res.status(201).json(record);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// ---------------------------------------------------------------------------
// Off-Rail Payout Governance
// ---------------------------------------------------------------------------

thePotLiteRouter.post("/payouts", async (req, res) => {
  try {
    const { potId, requestedByUserId, organizationId, payee, amountCents, purpose, dateNeeded } = req.body;
    const payout = await requestPayoutSpend({
      potId: Number(potId),
      requestedByUserId: Number(requestedByUserId),
      organizationId: Number(organizationId),
      payee,
      amountCents: Number(amountCents),
      purpose,
      dateNeeded: new Date(dateNeeded),
    });
    return res.status(201).json(payout);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/payouts/:id/approve", async (req, res) => {
  try {
    const payoutRecordId = Number(req.params.id);
    const { approverUserId, organizationId, decision, reason } = req.body;
    const result = await approvePayoutSpend({
      payoutRecordId,
      approverUserId: Number(approverUserId),
      organizationId: Number(organizationId),
      decision,
      reason,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.post("/payouts/:id/disburse", async (req, res) => {
  try {
    const payoutRecordId = Number(req.params.id);
    const { recorderUserId, organizationId, disbursementMethod, receiptInvoiceUrl } = req.body;
    const result = await markPayoutDisbursed({
      payoutRecordId,
      recorderUserId: Number(recorderUserId),
      organizationId: Number(organizationId),
      disbursementMethod,
      receiptInvoiceUrl,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// ---------------------------------------------------------------------------
// Cheffy Prompts
// ---------------------------------------------------------------------------

thePotLiteRouter.post("/cheffy/respond", async (req, res) => {
  try {
    const { promptId, selectedOption, responseNote } = req.body;
    const [updated] = await db.update(schema.cheffyPrompts)
      .set({
        status: "responded",
        selectedOption,
        responseNote,
        respondedAt: new Date(),
      })
      .where(eq(schema.cheffyPrompts.id, Number(promptId)))
      .returning();
    return res.status(200).json({ message: "Response recorded", prompt: updated });
  } catch (error) {
    return handleRouteError(res, error);
  }
});

// ---------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------

thePotLiteRouter.get("/dashboard/organizer", async (req, res) => {
  try {
    const organizationId = Number(req.query.organizationId);
    if (!organizationId) return res.status(400).json({ error: "organizationId required" });
    const summary = await getOrganizerDashboardSummary(organizationId);
    return res.status(200).json(summary);
  } catch (error) {
    return handleRouteError(res, error);
  }
});

thePotLiteRouter.get("/dashboard/member", async (req, res) => {
  try {
    const memberUserId = Number(req.query.memberUserId);
    if (!memberUserId) return res.status(400).json({ error: "memberUserId required" });
    const summary = await getMemberDashboardSummary(memberUserId);
    return res.status(200).json(summary);
  } catch (error) {
    return handleRouteError(res, error);
  }
});
