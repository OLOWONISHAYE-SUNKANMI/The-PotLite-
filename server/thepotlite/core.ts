import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * ============================================================================
 * THEPOTLITE CORE ENGINE (PHASE 1)
 * Versioned Obligations, Human Rules Engine & Append-Only Audit Trail
 * ============================================================================
 */

export interface LogAuditParams {
  actorUserId?: number;
  actorRole: "Organizer" | "Member" | "System";
  action: string;
  objectType: "Pot" | "Obligation" | "Payment" | "Vote" | "Payout" | "Rule" | "Team" | "Player";
  objectId: number;
  potId?: number;
  obligationId?: number;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  termsVersion?: number;
  ruleVersion?: number;
  plainTextTimelineEntry: string;
}

/**
 * Append-only Audit Logger
 * Strictly insert-only. No edits or deletions are permitted.
 */
export async function logAuditEvent(params: LogAuditParams) {
  const [event] = await db.insert(schema.auditEvents).values({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: params.action,
    objectType: params.objectType,
    objectId: params.objectId,
    potId: params.potId,
    obligationId: params.obligationId,
    beforeState: params.beforeState ?? null,
    afterState: params.afterState ?? null,
    termsVersion: params.termsVersion,
    ruleVersion: params.ruleVersion,
    plainTextTimelineEntry: params.plainTextTimelineEntry,
  }).returning();
  return event;
}

/**
 * Organization and Rules Initialization
 * Creates an organization and provisions its baseline version 1 Human Rules configuration
 * adhering strictly to Section 09 of the V1 Pilot Spec.
 */
export async function createOrganizationWithDefaultRules(params: {
  name: string;
  description?: string;
  sport?: string;
  createdById: number;
}) {
  // 1. Create Organization
  const [org] = await db.insert(schema.organizations).values({
    name: params.name,
    description: params.description,
    sport: params.sport ?? "youth_sports",
    currentRuleVersion: 1,
    createdById: params.createdById,
  }).returning();

  // 2. Provision Version 1 Org Rules with V1 defaults
  const [rules] = await db.insert(schema.orgRules).values({
    organizationId: org.id,
    version: 1,
    reminderScheduleDays: [-7, -3, -1, 1, 3, 5, 7], // 7, 3, 1 days before due; day after; every 2 days x3
    gracePeriodDays: 2,
    confirmationWindowHours: 48,
    finalNoticeResponseWindowHours: 12,
    inviteExpiryHours: 72,
    autoRemovalAllowed: true,
    assistanceVisibilityDefault: "organizers_only",
    voteThresholdPercent: 50,
    voteQuorumPercent: 50,
    voteDeadlineHours: 48,
    minorChangeLimit: "deadline_extensions_only",
    payoutDualApproverThresholdCents: 25000, // $250.00
    payoutVoteThresholdCents: 100000, // $1,000.00
    quietHoursStart: "21:00",
    quietHoursEnd: "08:00",
    customConditionActionRules: [
      {
        conditionState: "Invited",
        elapsedHours: 72,
        action: "expire_invite",
      },
      {
        conditionState: "Paid (pending confirmation)",
        elapsedHours: 48,
        action: "remind_confirmation_then_escalate",
      },
    ],
    createdById: params.createdById,
  }).returning();

  // 3. Register creator as Organizer in organizationMembers
  await db.insert(schema.organizationMembers).values({
    organizationId: org.id,
    userId: params.createdById,
    role: "Organizer",
    title: "Director",
  });

  // 4. Log Audit Event
  await logAuditEvent({
    actorUserId: params.createdById,
    actorRole: "Organizer",
    action: "organization_created",
    objectType: "Rule",
    objectId: org.id,
    ruleVersion: 1,
    plainTextTimelineEntry: `Organization "${org.name}" initialized with default governance rules v1`,
    afterState: { organizationId: org.id, ruleVersionId: rules.id },
  });

  return { organization: org, rules };
}

/**
 * Team Creation
 */
export async function createTeam(params: {
  organizationId: number;
  name: string;
  ageGroup?: string;
  coachUserId?: number;
  actorUserId: number;
  actorRole: "Organizer" | "Member" | "System";
}) {
  const [team] = await db.insert(schema.teams).values({
    organizationId: params.organizationId,
    name: params.name,
    ageGroup: params.ageGroup,
    coachUserId: params.coachUserId,
  }).returning();

  await logAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "team_created",
    objectType: "Team",
    objectId: team.id,
    plainTextTimelineEntry: `Team "${team.name}" added to organization`,
    afterState: team,
  });

  return team;
}

/**
 * COPPA-Compliant Player Registration
 * Spec section 13: Store only player's first name and last initial under parent membership.
 */
export async function registerPlayer(params: {
  organizationId: number;
  teamId: number;
  parentUserId: number;
  firstName: string;
  lastInitial: string;
  jerseyNumber?: string;
  actorUserId: number;
  actorRole: "Organizer" | "Member" | "System";
}) {
  // Sanitize lastInitial to strictly 1 character uppercase
  const sanitizedLastInitial = params.lastInitial.trim().charAt(0).toUpperCase();

  const [player] = await db.insert(schema.players).values({
    organizationId: params.organizationId,
    teamId: params.teamId,
    parentUserId: params.parentUserId,
    firstName: params.firstName.trim(),
    lastInitial: sanitizedLastInitial,
    jerseyNumber: params.jerseyNumber,
  }).returning();

  await logAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "player_registered",
    objectType: "Player",
    objectId: player.id,
    plainTextTimelineEntry: `Player ${player.firstName} ${player.lastInitial}. enrolled under parent membership (COPPA-safe)`,
    afterState: { id: player.id, name: `${player.firstName} ${player.lastInitial}.`, teamId: player.teamId },
  });

  return player;
}

/**
 * Pilot Pot Creation
 * V1 Pot types: season fee, tournament, uniforms and gear, travel, fundraiser, other.
 * Snapshots the active rule version so future changes to org rules don't silently alter active Pots.
 */
export async function createPilotPot(params: {
  organizationId: number;
  teamId?: number;
  name: string;
  purpose: string;
  potType: "season fee" | "tournament" | "uniforms and gear" | "travel" | "fundraiser" | "other";
  goalAmountCents: number;
  deadline: Date;
  createdById: number;
}) {
  // 1. Fetch current active rule version for the organization
  const activeRule = await db.query.orgRules.findFirst({
    where: eq(schema.orgRules.organizationId, params.organizationId),
    orderBy: [desc(schema.orgRules.version)],
  });

  if (!activeRule) {
    throw new Error(`No active org rules found for organization ${params.organizationId}`);
  }

  // 2. Create the Pot snapshotting the rule version
  const [pot] = await db.insert(schema.pilotPots).values({
    organizationId: params.organizationId,
    teamId: params.teamId,
    name: params.name,
    purpose: params.purpose,
    potType: params.potType,
    goalAmountCents: params.goalAmountCents,
    deadline: params.deadline,
    ruleVersionId: activeRule.id,
    createdById: params.createdById,
    status: "active",
  }).returning();

  // 3. Log Audit Trail
  await logAuditEvent({
    actorUserId: params.createdById,
    actorRole: "Organizer",
    action: "pot_created",
    objectType: "Pot",
    objectId: pot.id,
    potId: pot.id,
    ruleVersion: activeRule.version,
    plainTextTimelineEntry: `Pot "${pot.name}" ($${(pot.goalAmountCents / 100).toFixed(2)}) created for ${pot.purpose}`,
    afterState: pot,
  });

  return pot;
}

/**
 * Obligation Initialization with Versioned Installments
 * The core domain object: versioned, consent-gated state machine.
 */
export async function createObligationWithInstallments(params: {
  potId: number;
  memberUserId: number;
  playerId?: number;
  totalAmountCents: number;
  schedule: Array<{
    dueDate: Date;
    amountCents: number;
  }>;
  termsText?: string;
  createdByUserId: number;
  actorRole: "Organizer" | "Member" | "System";
}) {
  const pot = await db.query.pilotPots.findFirst({
    where: eq(schema.pilotPots.id, params.potId),
    with: { ruleVersion: true },
  });

  if (!pot) {
    throw new Error(`Pot ${params.potId} not found`);
  }

  const expiryHours = pot.ruleVersion?.inviteExpiryHours ?? 72;
  const inviteExpiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  // 1. Create Obligation in 'Invited' state
  const [obligation] = await db.insert(schema.obligations).values({
    potId: params.potId,
    memberUserId: params.memberUserId,
    playerId: params.playerId,
    currentVersionNumber: 1,
    totalAmountCents: params.totalAmountCents,
    confirmedAmountCents: 0,
    pendingAmountCents: 0,
    state: "Invited",
    inviteExpiresAt,
  }).returning();

  // 2. Create Obligation Version 1
  const [version] = await db.insert(schema.obligationVersions).values({
    obligationId: obligation.id,
    versionNumber: 1,
    amountCents: params.totalAmountCents,
    scheduleType: params.schedule.length > 1 ? "installments" : "single",
    termsText: params.termsText ?? `Terms for ${pot.name}`,
    changeReason: "Initial obligation invite",
    status: "active",
    proposedByUserId: params.createdByUserId,
  }).returning();

  // 3. Create Installments
  const installmentsList = [];
  for (let i = 0; i < params.schedule.length; i++) {
    const item = params.schedule[i];
    const [inst] = await db.insert(schema.installments).values({
      obligationId: obligation.id,
      obligationVersionId: version.id,
      installmentNumber: i + 1,
      amountCents: item.amountCents,
      confirmedAmountCents: 0,
      dueDate: item.dueDate,
      state: "Invited",
    }).returning();
    installmentsList.push(inst);
  }

  // 4. Log Audit Event
  await logAuditEvent({
    actorUserId: params.createdByUserId,
    actorRole: params.actorRole,
    action: "obligation_invited",
    objectType: "Obligation",
    objectId: obligation.id,
    potId: params.potId,
    obligationId: obligation.id,
    termsVersion: 1,
    plainTextTimelineEntry: `Invite sent to member for $${(params.totalAmountCents / 100).toFixed(2)} with ${params.schedule.length} installment(s)`,
    afterState: { obligationId: obligation.id, amountCents: params.totalAmountCents, state: "Invited" },
  });

  return { obligation, version, installments: installmentsList };
}

/**
 * Accept Obligation
 * Member accepts terms. An invite not accepted is not an obligation.
 */
export async function acceptObligation(params: {
  obligationId: number;
  memberUserId: number;
}) {
  const obligation = await db.query.obligations.findFirst({
    where: eq(schema.obligations.id, params.obligationId),
  });

  if (!obligation) {
    throw new Error(`Obligation ${params.obligationId} not found`);
  }

  if (obligation.memberUserId !== params.memberUserId) {
    throw new Error("Unauthorized: Only the invited member can accept this obligation");
  }

  const now = new Date();

  // Update Obligation State to 'Accepted'
  const [updatedObligation] = await db.update(schema.obligations)
    .set({
      state: "Accepted",
      acceptedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.obligations.id, params.obligationId))
    .returning();

  // Update Installments to 'Accepted'
  await db.update(schema.installments)
    .set({ state: "Accepted" })
    .where(eq(schema.installments.obligationId, params.obligationId));

  // Update Version row
  await db.update(schema.obligationVersions)
    .set({
      acceptedByUserId: params.memberUserId,
      acceptedAt: now,
    })
    .where(
      and(
        eq(schema.obligationVersions.obligationId, params.obligationId),
        eq(schema.obligationVersions.versionNumber, obligation.currentVersionNumber)
      )
    );

  // Log Audit Event
  await logAuditEvent({
    actorUserId: params.memberUserId,
    actorRole: "Member",
    action: "obligation_accepted",
    objectType: "Obligation",
    objectId: obligation.id,
    potId: obligation.potId,
    obligationId: obligation.id,
    termsVersion: obligation.currentVersionNumber,
    plainTextTimelineEntry: `Member accepted obligation of $${(obligation.totalAmountCents / 100).toFixed(2)}, terms version ${obligation.currentVersionNumber}`,
    beforeState: { state: obligation.state },
    afterState: { state: "Accepted", acceptedAt: now },
  });

  return updatedObligation;
}

/**
 * Propose Obligation Change (Consent-Gated State Machine)
 * "Every change to amount or date creates a new version.
 *  The previous version stays in force until the member accepts the new one."
 */
export async function proposeObligationChange(params: {
  obligationId: number;
  newAmountCents: number;
  schedule: Array<{ dueDate: Date; amountCents: number }>;
  changeReason: string;
  proposedByUserId: number;
  actorRole: "Organizer" | "Member" | "System";
}) {
  const obligation = await db.query.obligations.findFirst({
    where: eq(schema.obligations.id, params.obligationId),
  });

  if (!obligation) {
    throw new Error(`Obligation ${params.obligationId} not found`);
  }

  const newVersionNumber = obligation.currentVersionNumber + 1;

  // 1. Create a pending obligation version (previous version remains 'active'!)
  const [newVersion] = await db.insert(schema.obligationVersions).values({
    obligationId: obligation.id,
    versionNumber: newVersionNumber,
    amountCents: params.newAmountCents,
    scheduleType: params.schedule.length > 1 ? "installments" : "single",
    changeReason: params.changeReason,
    status: "pending_acceptance",
    proposedByUserId: params.proposedByUserId,
  }).returning();

  // 2. Create pending installments tied to the new version
  for (let i = 0; i < params.schedule.length; i++) {
    const item = params.schedule[i];
    await db.insert(schema.installments).values({
      obligationId: obligation.id,
      obligationVersionId: newVersion.id,
      installmentNumber: i + 1,
      amountCents: item.amountCents,
      confirmedAmountCents: 0,
      dueDate: item.dueDate,
      state: "Invited",
    });
  }

  // 3. Mark obligation as 'Change pending' while keeping current terms active
  await db.update(schema.obligations)
    .set({
      previousState: obligation.state,
      state: "Change pending",
      updatedAt: new Date(),
    })
    .where(eq(schema.obligations.id, params.obligationId));

  // 4. Log Audit Event
  await logAuditEvent({
    actorUserId: params.proposedByUserId,
    actorRole: params.actorRole,
    action: "obligation_change_proposed",
    objectType: "Obligation",
    objectId: obligation.id,
    potId: obligation.potId,
    obligationId: obligation.id,
    termsVersion: newVersionNumber,
    plainTextTimelineEntry: `Proposed change: $${(params.newAmountCents / 100).toFixed(2)} (v${newVersionNumber}) - Reason: ${params.changeReason}. Previous version ${obligation.currentVersionNumber} remains in force pending member acceptance.`,
    afterState: { pendingVersion: newVersionNumber, amountCents: params.newAmountCents },
  });

  return newVersion;
}

/**
 * Member Accepts Obligation Change
 * Activates new version, supersedes old version.
 */
export async function memberAcceptObligationChange(params: {
  obligationId: number;
  versionNumber: number;
  memberUserId: number;
}) {
  const obligation = await db.query.obligations.findFirst({
    where: eq(schema.obligations.id, params.obligationId),
  });

  if (!obligation || obligation.memberUserId !== params.memberUserId) {
    throw new Error("Unauthorized or obligation not found");
  }

  const targetVersion = await db.query.obligationVersions.findFirst({
    where: and(
      eq(schema.obligationVersions.obligationId, params.obligationId),
      eq(schema.obligationVersions.versionNumber, params.versionNumber)
    ),
  });

  if (!targetVersion || targetVersion.status !== "pending_acceptance") {
    throw new Error("Target version is not in pending_acceptance status");
  }

  const now = new Date();

  // 1. Supersede previous active version
  await db.update(schema.obligationVersions)
    .set({ status: "superseded" })
    .where(
      and(
        eq(schema.obligationVersions.obligationId, params.obligationId),
        eq(schema.obligationVersions.status, "active")
      )
    );

  // 2. Activate target version
  await db.update(schema.obligationVersions)
    .set({
      status: "active",
      acceptedByUserId: params.memberUserId,
      acceptedAt: now,
    })
    .where(eq(schema.obligationVersions.id, targetVersion.id));

  // 3. Determine resumed state based on confirmed payments
  let resumedState = "Accepted";
  if (obligation.confirmedAmountCents >= targetVersion.amountCents) {
    resumedState = "Confirmed";
  } else if (obligation.confirmedAmountCents > 0) {
    resumedState = "Partially paid";
  }

  // 4. Update obligation pointer to new version
  const [updatedObligation] = await db.update(schema.obligations)
    .set({
      currentVersionNumber: targetVersion.versionNumber,
      totalAmountCents: targetVersion.amountCents,
      state: resumedState,
      updatedAt: now,
    })
    .where(eq(schema.obligations.id, params.obligationId))
    .returning();

  // 5. Log Audit Event
  await logAuditEvent({
    actorUserId: params.memberUserId,
    actorRole: "Member",
    action: "obligation_change_accepted",
    objectType: "Obligation",
    objectId: obligation.id,
    potId: obligation.potId,
    obligationId: obligation.id,
    termsVersion: targetVersion.versionNumber,
    plainTextTimelineEntry: `Member accepted updated terms v${targetVersion.versionNumber}: $${(targetVersion.amountCents / 100).toFixed(2)}`,
    afterState: { currentVersionNumber: targetVersion.versionNumber, state: resumedState },
  });

  return updatedObligation;
}

/**
 * Member Declines Obligation Change
 * Current terms stay in effect. Organizers are alerted.
 */
export async function memberDeclineObligationChange(params: {
  obligationId: number;
  versionNumber: number;
  memberUserId: number;
  declineReason?: string;
}) {
  const obligation = await db.query.obligations.findFirst({
    where: eq(schema.obligations.id, params.obligationId),
  });

  if (!obligation || obligation.memberUserId !== params.memberUserId) {
    throw new Error("Unauthorized or obligation not found");
  }

  // Mark proposed version as declined
  await db.update(schema.obligationVersions)
    .set({
      status: "declined",
      declinedAt: new Date(),
    })
    .where(
      and(
        eq(schema.obligationVersions.obligationId, params.obligationId),
        eq(schema.obligationVersions.versionNumber, params.versionNumber)
      )
    );

  // Restore obligation state from previousState
  const restoredState = obligation.previousState ?? "Accepted";
  const [updatedObligation] = await db.update(schema.obligations)
    .set({
      state: restoredState,
      updatedAt: new Date(),
    })
    .where(eq(schema.obligations.id, params.obligationId))
    .returning();

  // Log Audit Event
  await logAuditEvent({
    actorUserId: params.memberUserId,
    actorRole: "Member",
    action: "obligation_change_declined",
    objectType: "Obligation",
    objectId: obligation.id,
    potId: obligation.potId,
    obligationId: obligation.id,
    termsVersion: obligation.currentVersionNumber,
    plainTextTimelineEntry: `Member declined proposed terms v${params.versionNumber}. Previous terms v${obligation.currentVersionNumber} remain in force. Reason: ${params.declineReason ?? "None provided"}`,
    afterState: { state: restoredState, activeVersion: obligation.currentVersionNumber },
  });

  return updatedObligation;
}

/**
 * Check Pot Completion Status
 * Section 03: "A Pot completes automatically when every active obligation is Confirmed."
 */
export async function evaluatePotCompletion(potId: number) {
  const activeObligations = await db.query.obligations.findMany({
    where: and(
      eq(schema.obligations.potId, potId),
      // Withdrawn and Removed are closed side states, not active obligations
      sql`${schema.obligations.state} NOT IN ('Withdrawn', 'Removed')`
    ),
  });

  if (activeObligations.length === 0) {
    return false;
  }

  const allConfirmed = activeObligations.every((ob) => ob.state === "Confirmed");

  if (allConfirmed) {
    await db.update(schema.pilotPots)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.pilotPots.id, potId));

    await logAuditEvent({
      actorRole: "System",
      action: "pot_completed",
      objectType: "Pot",
      objectId: potId,
      potId,
      plainTextTimelineEntry: `Pot #${potId} completed automatically: all active obligations confirmed`,
      afterState: { status: "completed" },
    });

    return true;
  }

  return false;
}

