import crypto from "crypto";
import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  logAuditEvent,
  evaluatePotCompletion,
  createObligationWithInstallments,
  acceptObligation,
} from "./core";
import {
  assertCanApprovePayout,
  assertCanConfirmPayment,
  assertCanViewAssistanceRequest,
  assertCanViewRepaymentRecord,
  assertOrganizer,
  assertMember,
  PermissionError,
} from "./permissions";

/**
 * ============================================================================
 * THEPOTLITE V1 COMPREHENSIVE BUSINESS LOGIC ENGINE
 * Offline Payments, Cheffy Prompts, Hardship, Governance & Dashboards
 * "No money handled. No disputes adjudicated. No obligations silently changed."
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Invitations & Tokenized Access
// ---------------------------------------------------------------------------

export async function createPotInvitation(params: {
  potId: number;
  memberUserId: number;
  playerId?: number;
  totalAmountCents: number;
  schedule: Array<{ dueDate: Date; amountCents: number }>;
  createdById: number;
  termsText?: string;
}) {
  const pot = await db.query.pilotPots.findFirst({
    where: eq(schema.pilotPots.id, params.potId),
    with: { ruleVersion: true, organization: true },
  });

  if (!pot) {
    throw new Error(`Pot #${params.potId} not found`);
  }

  // Create obligation in 'Invited' state
  const { obligation, version, installments } = await createObligationWithInstallments({
    potId: params.potId,
    memberUserId: params.memberUserId,
    playerId: params.playerId,
    totalAmountCents: params.totalAmountCents,
    schedule: params.schedule,
    termsText: params.termsText,
    createdByUserId: params.createdById,
    actorRole: "Organizer",
  });

  // Generate unique token (using crypto)
  const token = `inv_${obligation.id}_${crypto.randomBytes(12).toString("hex")}`;

  // Create Cheffy Prompt for member
  await db.insert(schema.cheffyPrompts).values({
    recipientUserId: params.memberUserId,
    potId: params.potId,
    obligationId: obligation.id,
    triggerType: "invite_unanswered",
    waitingOn: "Member",
    promptText: `You've been invited to ${pot.name}: $${(params.totalAmountCents / 100).toFixed(2)} due by ${pot.deadline.toISOString().split("T")[0]}. In or out?`,
    options: ["Accept", "Decline", "Question for organizer"],
    status: "pending",
  });

  return { token, obligation, version, installments };
}

export async function getInvitationDetails(obligationId: number) {
  const obligation = await db.query.obligations.findFirst({
    where: eq(schema.obligations.id, obligationId),
    with: {
      pot: {
        with: {
          organization: true,
          team: true,
          ruleVersion: true,
        },
      },
      player: true,
      versions: {
        where: eq(schema.obligationVersions.status, "active"),
      },
      installments: true,
    },
  });

  if (!obligation) {
    throw new Error("Invitation not found");
  }

  return obligation;
}

// ---------------------------------------------------------------------------
// 2. Opt-Out & Withdrawal Engine
// ---------------------------------------------------------------------------

export async function withdrawMemberFromPot(params: {
  obligationId: number;
  memberUserId: number;
  reason?: string;
}) {
  const obligation = await db.query.obligations.findFirst({
    where: eq(schema.obligations.id, params.obligationId),
    with: { pot: true },
  });

  if (!obligation || obligation.memberUserId !== params.memberUserId) {
    throw new PermissionError("Unauthorized to withdraw this obligation");
  }

  const now = new Date();

  // Spec Section 04:
  // If withdrawal with no confirmed payment -> obligation closes as Withdrawn
  // If after confirmed payment -> payment record stays; refund agreement recorded separately
  const [updated] = await db.update(schema.obligations)
    .set({
      previousState: obligation.state,
      state: "Withdrawn",
      withdrawnAt: now,
      withdrawalReason: params.reason ?? "Member requested exit",
      updatedAt: now,
    })
    .where(eq(schema.obligations.id, params.obligationId))
    .returning();

  // Flag Pot goal & remaining shares as Change pending
  await db.update(schema.pilotPots)
    .set({ hasChangePending: true, updatedAt: now })
    .where(eq(schema.pilotPots.id, obligation.potId));

  // Log audit event
  await logAuditEvent({
    actorUserId: params.memberUserId,
    actorRole: "Member",
    action: "obligation_withdrawn",
    objectType: "Obligation",
    objectId: obligation.id,
    potId: obligation.potId,
    obligationId: obligation.id,
    plainTextTimelineEntry: `Member withdrew from ${obligation.pot.name}. Reason: ${params.reason ?? "None provided"}. Pot shares flagged Change Pending.`,
    beforeState: { state: obligation.state },
    afterState: { state: "Withdrawn", reason: params.reason },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// 3. Dual-Confirmation Offline Payment Engine & Neutral Disputes
// ---------------------------------------------------------------------------

export async function recordOfflinePayment(params: {
  potId: number;
  obligationId: number;
  installmentId?: number;
  initiatedByUserId: number;
  initiatedByRole: "Organizer" | "Member";
  payerUserId: number;
  amountCents: number;
  method: "cash" | "Cash App" | "Zelle" | "Venmo" | "check" | "other app" | "other";
  dateSent: Date;
  referenceNote?: string;
  receiptPhotoUrl?: string;
  statement?: string;
}) {
  const pot = await db.query.pilotPots.findFirst({
    where: eq(schema.pilotPots.id, params.potId),
    with: { ruleVersion: true },
  });

  if (!pot) throw new Error("Pot not found");

  const confirmationHours = pot.ruleVersion?.confirmationWindowHours ?? 48;
  const confirmationDeadline = new Date(Date.now() + confirmationHours * 60 * 60 * 1000);

  // 1. Insert offline payment in 'pending_confirmation' state
  const [payment] = await db.insert(schema.offlinePayments).values({
    potId: params.potId,
    obligationId: params.obligationId,
    installmentId: params.installmentId,
    amountCents: params.amountCents,
    method: params.method,
    dateSent: params.dateSent,
    referenceNote: params.referenceNote,
    receiptPhotoUrl: params.receiptPhotoUrl,
    initiatedByRole: params.initiatedByRole,
    initiatedByUserId: params.initiatedByUserId,
    payerUserId: params.payerUserId,
    status: "pending_confirmation",
    memberStatement: params.initiatedByRole === "Member" ? params.statement ?? "Sent payment" : null,
    organizerStatement: params.initiatedByRole === "Organizer" ? params.statement ?? "Received payment" : null,
    confirmationDeadline,
  }).returning();

  // 2. Update obligation pending amount
  await db.update(schema.obligations)
    .set({
      pendingAmountCents: sql`${schema.obligations.pendingAmountCents} + ${params.amountCents}`,
      state: "Paid (pending confirmation)",
      updatedAt: new Date(),
    })
    .where(eq(schema.obligations.id, params.obligationId));

  // 3. Dispatch Cheffy Prompt to the verifying party
  if (params.initiatedByRole === "Member") {
    // Notify Organizers
    await db.insert(schema.cheffyPrompts).values({
      recipientUserId: pot.createdById, // Primary organizer
      potId: params.potId,
      obligationId: params.obligationId,
      triggerType: "member_marked_paid",
      waitingOn: "Organizer",
      promptText: `Member says they sent $${(params.amountCents / 100).toFixed(2)} by ${params.method}. Did you receive it?`,
      options: ["Received", "Not yet", "Different amount"],
      status: "pending",
    });
  } else {
    // Notify Member
    await db.insert(schema.cheffyPrompts).values({
      recipientUserId: params.payerUserId,
      potId: params.potId,
      obligationId: params.obligationId,
      triggerType: "organizer_marked_received",
      waitingOn: "Member",
      promptText: `Organizer recorded $${(params.amountCents / 100).toFixed(2)} from you by ${params.method}. Correct?`,
      options: ["Yes", "No", "Different amount"],
      status: "pending",
    });
  }

  // 4. Log Audit Event
  await logAuditEvent({
    actorUserId: params.initiatedByUserId,
    actorRole: params.initiatedByRole,
    action: "payment_recorded_offline",
    objectType: "Payment",
    objectId: payment.id,
    potId: params.potId,
    obligationId: params.obligationId,
    plainTextTimelineEntry: `${params.initiatedByRole} recorded $${(params.amountCents / 100).toFixed(2)} via ${params.method}. Pending two-party confirmation.`,
    afterState: { paymentId: payment.id, amountCents: params.amountCents, method: params.method },
  });

  return payment;
}

export async function confirmOfflinePayment(params: {
  paymentId: number;
  confirmingUserId: number;
  organizationId: number;
}) {
  // Check Anti-Self-Approval
  const payment = await assertCanConfirmPayment({
    paymentId: params.paymentId,
    confirmingUserId: params.confirmingUserId,
    organizationId: params.organizationId,
  });

  const now = new Date();

  // 1. Mark payment as 'confirmed'
  const [confirmedPayment] = await db.update(schema.offlinePayments)
    .set({
      status: "confirmed",
      confirmedByUserId: params.confirmingUserId,
      confirmedAt: now,
    })
    .where(eq(schema.offlinePayments.id, params.paymentId))
    .returning();

  // 2. Fetch obligation
  const obligation = await db.query.obligations.findFirst({
    where: eq(schema.obligations.id, payment.obligationId),
  });

  if (!obligation) throw new Error("Obligation not found");

  const newConfirmedAmount = obligation.confirmedAmountCents + payment.amountCents;
  const newPendingAmount = Math.max(0, obligation.pendingAmountCents - payment.amountCents);

  let newState = "Partially paid";
  if (newConfirmedAmount >= obligation.totalAmountCents) {
    newState = "Confirmed";
  }

  // 3. Update obligation
  await db.update(schema.obligations)
    .set({
      confirmedAmountCents: newConfirmedAmount,
      pendingAmountCents: newPendingAmount,
      state: newState,
      updatedAt: now,
    })
    .where(eq(schema.obligations.id, obligation.id));

  // 4. Update installment if tied
  if (payment.installmentId) {
    await db.update(schema.installments)
      .set({
        confirmedAmountCents: sql`${schema.installments.confirmedAmountCents} + ${payment.amountCents}`,
        state: "Confirmed",
      })
      .where(eq(schema.installments.id, payment.installmentId));
  }

  // 5. Update Pot confirmed total
  await db.update(schema.pilotPots)
    .set({
      confirmedTotalCents: sql`${schema.pilotPots.confirmedTotalCents} + ${payment.amountCents}`,
      pendingTotalCents: sql`GREATEST(0, ${schema.pilotPots.pendingTotalCents} - ${payment.amountCents})`,
      updatedAt: now,
    })
    .where(eq(schema.pilotPots.id, payment.potId));

  // 6. Check automatic Pot completion
  await evaluatePotCompletion(payment.potId);

  // 7. Log Audit Event
  await logAuditEvent({
    actorUserId: params.confirmingUserId,
    actorRole: "Organizer",
    action: "payment_confirmed",
    objectType: "Payment",
    objectId: payment.id,
    potId: payment.potId,
    obligationId: payment.obligationId,
    plainTextTimelineEntry: `Payment of $${(payment.amountCents / 100).toFixed(2)} confirmed. Obligation status: ${newState}.`,
    afterState: { state: "confirmed", confirmedAmountCents: newConfirmedAmount },
  });

  return confirmedPayment;
}

export async function disputeOfflinePayment(params: {
  paymentId: number;
  disputingUserId: number;
  disputeType: "denial" | "mismatch";
  counterStatement: string;
}) {
  const payment = await db.query.offlinePayments.findFirst({
    where: eq(schema.offlinePayments.id, params.paymentId),
    with: { pot: true },
  });

  if (!payment) throw new Error("Payment not found");

  const now = new Date();

  // Spec Section 05:
  // "Mismatch or Denial -> goes to Disputed with both statements logged.
  //  ThePotLite never decides who is right."
  const [disputedPayment] = await db.update(schema.offlinePayments)
    .set({
      status: "disputed",
      disputedAt: now,
      memberStatement:
        payment.initiatedByRole === "Organizer"
          ? params.counterStatement
          : payment.memberStatement,
      organizerStatement:
        payment.initiatedByRole === "Member"
          ? params.counterStatement
          : payment.organizerStatement,
    })
    .where(eq(schema.offlinePayments.id, params.paymentId))
    .returning();

  // Obligation side-state marked 'Disputed'
  await db.update(schema.obligations)
    .set({
      state: "Disputed",
      updatedAt: now,
    })
    .where(eq(schema.obligations.id, payment.obligationId));

  // Log Audit Event (strictly neutral recording)
  await logAuditEvent({
    actorUserId: params.disputingUserId,
    actorRole: payment.initiatedByRole === "Member" ? "Organizer" : "Member",
    action: "payment_disputed",
    objectType: "Payment",
    objectId: payment.id,
    potId: payment.potId,
    obligationId: payment.obligationId,
    plainTextTimelineEntry: `Payment of $${(payment.amountCents / 100).toFixed(2)} entered Disputed state. Both statements logged. ThePotLite does not adjudicate disputes.`,
    afterState: { status: "disputed", disputeType: params.disputeType },
  });

  return disputedPayment;
}

// ---------------------------------------------------------------------------
// 4. Assistance, Extensions & Sponsorship (The Yellow Path)
// ---------------------------------------------------------------------------

export async function requestAssistance(params: {
  obligationId: number;
  memberUserId: number;
  needType: "more_time" | "financial_help";
  visibility?: "organizers_only" | "organizers_and_group";
  proposedNewDate?: Date;
  requestedAmountCents?: number;
  notes?: string;
}) {
  const obligation = await db.query.obligations.findFirst({
    where: eq(schema.obligations.id, params.obligationId),
  });

  if (!obligation || obligation.memberUserId !== params.memberUserId) {
    throw new PermissionError("Unauthorized to request assistance on this obligation");
  }

  // 1. Create assistance request record
  const [reqRecord] = await db.insert(schema.assistanceRequests).values({
    obligationId: params.obligationId,
    memberUserId: params.memberUserId,
    needType: params.needType,
    visibility: params.visibility ?? "organizers_only", // Default is organizers only!
    proposedNewDate: params.proposedNewDate,
    requestedAmountCents: params.requestedAmountCents,
    notes: params.notes,
    status: "pending",
  }).returning();

  // 2. Set obligation side state
  await db.update(schema.obligations)
    .set({
      previousState: obligation.state,
      state: "Assistance pending",
      updatedAt: new Date(),
    })
    .where(eq(schema.obligations.id, params.obligationId));

  // 3. Log Audit Event
  await logAuditEvent({
    actorUserId: params.memberUserId,
    actorRole: "Member",
    action: "assistance_requested",
    objectType: "Obligation",
    objectId: obligation.id,
    potId: obligation.potId,
    obligationId: obligation.id,
    plainTextTimelineEntry: `Member requested ${params.needType === "more_time" ? "extension (more time)" : "financial assistance"}. Visibility: ${params.visibility ?? "organizers only"}.`,
    afterState: { needType: params.needType, visibility: reqRecord.visibility },
  });

  return reqRecord;
}

export async function recordSponsorCoverage(params: {
  obligationId: number;
  installmentId?: number;
  sponsorUserId: number;
  coveredMemberUserId: number;
  amountCents: number;
  isGift: boolean;
  repaymentAmountCents?: number;
  repaymentDueDate?: Date;
}) {
  const [sponsorship] = await db.insert(schema.sponsorshipRecords).values({
    obligationId: params.obligationId,
    installmentId: params.installmentId,
    sponsorUserId: params.sponsorUserId,
    coveredMemberUserId: params.coveredMemberUserId,
    amountCents: params.amountCents,
    isGift: params.isGift,
    repaymentAgreed: !params.isGift,
    repaymentAmountCents: params.repaymentAmountCents,
    repaymentDueDate: params.repaymentDueDate,
    repaymentAcceptedBySponsor: true,
    repaymentAcceptedByMember: params.isGift, // Gifts don't require member repayment acceptance
  }).returning();

  await logAuditEvent({
    actorUserId: params.sponsorUserId,
    actorRole: "Member",
    action: "sponsor_coverage_offered",
    objectType: "Obligation",
    objectId: params.obligationId,
    obligationId: params.obligationId,
    plainTextTimelineEntry: `Sponsor offered coverage of $${(params.amountCents / 100).toFixed(2)} (${params.isGift ? "Gift" : "Repayment promised"}). Separate bilateral record.`,
    afterState: { sponsorshipId: sponsorship.id, isGift: params.isGift },
  });

  return sponsorship;
}

// ---------------------------------------------------------------------------
// 5. Off-Rail Payout Governance
// ---------------------------------------------------------------------------

export async function requestPayoutSpend(params: {
  potId: number;
  requestedByUserId: number;
  organizationId: number;
  payee: string;
  amountCents: number;
  purpose: string;
  dateNeeded: Date;
}) {
  await assertOrganizer(params.requestedByUserId, params.organizationId);

  const pot = await db.query.pilotPots.findFirst({
    where: eq(schema.pilotPots.id, params.potId),
    with: { ruleVersion: true },
  });

  if (!pot) throw new Error("Pot not found");

  // Spec Section 10: "A payout cannot exceed the Pot's confirmed balance"
  const previousDisbursed = await db.query.payoutRecords.findMany({
    where: and(
      eq(schema.payoutRecords.potId, params.potId),
      eq(schema.payoutRecords.status, "disbursed")
    ),
  });

  const totalDisbursed = previousDisbursed.reduce((sum, p) => sum + p.amountCents, 0);
  const availableConfirmedBalance = pot.confirmedTotalCents - totalDisbursed;

  if (params.amountCents > availableConfirmedBalance) {
    throw new Error(
      `Payout amount ($${(params.amountCents / 100).toFixed(2)}) exceeds Pot's confirmed balance of $${(availableConfirmedBalance / 100).toFixed(2)}`
    );
  }

  // Check if payout amount requires group member vote
  const voteThreshold = pot.ruleVersion?.payoutVoteThresholdCents ?? 100000;
  const requiresVote = params.amountCents >= voteThreshold;

  const [payout] = await db.insert(schema.payoutRecords).values({
    potId: params.potId,
    requestedByUserId: params.requestedByUserId,
    payee: params.payee,
    amountCents: params.amountCents,
    purpose: params.purpose,
    dateNeeded: params.dateNeeded,
    status: "pending_approval",
    requiresVote,
  }).returning();

  await logAuditEvent({
    actorUserId: params.requestedByUserId,
    actorRole: "Organizer",
    action: "payout_requested",
    objectType: "Payout",
    objectId: payout.id,
    potId: params.potId,
    plainTextTimelineEntry: `Organizer requested payout of $${(params.amountCents / 100).toFixed(2)} to ${params.payee} for ${params.purpose}. Subject to separation of duties.`,
    afterState: { payoutId: payout.id, amountCents: params.amountCents, payee: params.payee },
  });

  return payout;
}

export async function approvePayoutSpend(params: {
  payoutRecordId: number;
  approverUserId: number;
  organizationId: number;
  decision: "approved" | "rejected";
  reason?: string;
}) {
  // Enforce Anti-Self-Approval and separation of duties
  const payout = await assertCanApprovePayout({
    payoutRecordId: params.payoutRecordId,
    approverUserId: params.approverUserId,
    organizationId: params.organizationId,
  });

  // Record approval entry
  await db.insert(schema.payoutApprovals).values({
    payoutRecordId: params.payoutRecordId,
    approverUserId: params.approverUserId,
    decision: params.decision,
    reason: params.reason,
  });

  const newStatus = params.decision === "approved" ? "approved" : "rejected";
  await db.update(schema.payoutRecords)
    .set({
      status: newStatus,
      rejectionReason: params.decision === "rejected" ? params.reason : null,
    })
    .where(eq(schema.payoutRecords.id, params.payoutRecordId));

  await logAuditEvent({
    actorUserId: params.approverUserId,
    actorRole: "Organizer",
    action: `payout_${params.decision}`,
    objectType: "Payout",
    objectId: payout.id,
    potId: payout.potId,
    plainTextTimelineEntry: `Second organizer ${params.decision} payout of $${(payout.amountCents / 100).toFixed(2)} to ${payout.payee}.`,
    afterState: { status: newStatus },
  });

  return { success: true, status: newStatus };
}

export async function markPayoutDisbursed(params: {
  payoutRecordId: number;
  recorderUserId: number;
  organizationId: number;
  disbursementMethod: "check" | "card" | "wire" | "cash" | "other";
  receiptInvoiceUrl?: string;
}) {
  await assertOrganizer(params.recorderUserId, params.organizationId);

  const payout = await db.query.payoutRecords.findFirst({
    where: eq(schema.payoutRecords.id, params.payoutRecordId),
  });

  if (!payout || payout.status !== "approved") {
    throw new Error("Only approved payouts can be marked as disbursed");
  }

  const now = new Date();
  const [disbursed] = await db.update(schema.payoutRecords)
    .set({
      status: "disbursed",
      disbursedAt: now,
      disbursementMethod: params.disbursementMethod,
      receiptInvoiceUrl: params.receiptInvoiceUrl,
    })
    .where(eq(schema.payoutRecords.id, params.payoutRecordId))
    .returning();

  await logAuditEvent({
    actorUserId: params.recorderUserId,
    actorRole: "Organizer",
    action: "payout_disbursed",
    objectType: "Payout",
    objectId: payout.id,
    potId: payout.potId,
    plainTextTimelineEntry: `Disbursement recorded: $${(payout.amountCents / 100).toFixed(2)} paid to ${payout.payee} via ${params.disbursementMethod}. Evidence attached.`,
    afterState: { status: "disbursed", method: params.disbursementMethod },
  });

  return disbursed;
}

// ---------------------------------------------------------------------------
// 6. Dashboards & Triage Queue Data Services
// ---------------------------------------------------------------------------

export async function getOrganizerDashboardSummary(organizationId: number) {
  // 1. Fetch active pots
  const pots = await db.query.pilotPots.findMany({
    where: eq(schema.pilotPots.organizationId, organizationId),
    with: {
      team: true,
      obligations: true,
    },
    orderBy: [desc(schema.pilotPots.createdAt)],
  });

  // 2. Fetch Needs You Queue items
  const pendingConfirmations = await db.query.offlinePayments.findMany({
    where: and(
      eq(schema.offlinePayments.status, "pending_confirmation"),
      eq(schema.offlinePayments.initiatedByRole, "Member")
    ),
    with: { obligation: true },
    limit: 10,
  });

  const disputes = await db.query.offlinePayments.findMany({
    where: eq(schema.offlinePayments.status, "disputed"),
    limit: 10,
  });

  const pendingAssistance = await db.query.assistanceRequests.findMany({
    where: eq(schema.assistanceRequests.status, "pending"),
    limit: 10,
  });

  const pendingPayouts = await db.query.payoutRecords.findMany({
    where: eq(schema.payoutRecords.status, "pending_approval"),
    limit: 10,
  });

  return {
    pots: pots.map((p) => ({
      id: p.id,
      name: p.name,
      potType: p.potType,
      goalAmountCents: p.goalAmountCents,
      confirmedTotalCents: p.confirmedTotalCents, // Confirmed totals only!
      pendingTotalCents: p.pendingTotalCents,
      deadline: p.deadline,
      status: p.status,
      teamName: p.team?.name,
      obligationCounts: {
        total: p.obligations.length,
        confirmed: p.obligations.filter((o) => o.state === "Confirmed").length,
        pending: p.obligations.filter((o) => o.state === "Paid (pending confirmation)").length,
        overdue: p.obligations.filter((o) => o.state === "Overdue").length,
      },
    })),
    needsYouQueue: {
      pendingConfirmations,
      disputes,
      pendingAssistance,
      pendingPayouts,
      totalActionable:
        pendingConfirmations.length +
        disputes.length +
        pendingAssistance.length +
        pendingPayouts.length,
    },
  };
}

export async function getMemberDashboardSummary(memberUserId: number) {
  // 1. Fetch member's obligations
  const myObligations = await db.query.obligations.findMany({
    where: eq(schema.obligations.memberUserId, memberUserId),
    with: {
      pot: {
        with: {
          organization: true,
        },
      },
      player: true,
      installments: true,
    },
    orderBy: [desc(schema.obligations.createdAt)],
  });

  // 2. Fetch pending Cheffy prompts
  const activePrompts = await db.query.cheffyPrompts.findMany({
    where: and(
      eq(schema.cheffyPrompts.recipientUserId, memberUserId),
      eq(schema.cheffyPrompts.status, "pending")
    ),
    orderBy: [desc(schema.cheffyPrompts.sentAt)],
  });

  return {
    obligations: myObligations.map((o) => ({
      id: o.id,
      potId: o.potId,
      potName: o.pot.name,
      potType: o.pot.potType,
      totalAmountCents: o.totalAmountCents,
      confirmedAmountCents: o.confirmedAmountCents,
      pendingAmountCents: o.pendingAmountCents,
      state: o.state,
      playerName: o.player ? `${o.player.firstName} ${o.player.lastInitial}.` : null,
      installments: o.installments,
      needsAction: o.state === "Invited" || o.state === "Change pending" || activePrompts.some((p) => p.obligationId === o.id),
    })),
    activePrompts,
  };
}
