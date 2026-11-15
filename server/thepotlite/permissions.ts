import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * ============================================================================
 * THEPOTLITE PERMISSIONS & ANTI-SELF-APPROVAL ENGINE (PHASE 2)
 * "Nobody approves their own action."
 * Server-enforced RBAC, tenant isolation, and strict privacy boundaries.
 * ============================================================================
 */

export class PermissionError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = "PermissionError";
    this.statusCode = statusCode;
  }
}

/**
 * Get user's membership and role within an organization
 */
export async function getUserOrgMembership(userId: number, organizationId: number) {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(schema.organizationMembers.userId, userId),
      eq(schema.organizationMembers.organizationId, organizationId)
    ),
  });
  return membership;
}

/**
 * Require Organizer role for the given organization
 */
export async function assertOrganizer(userId: number, organizationId: number) {
  const membership = await getUserOrgMembership(userId, organizationId);
  if (!membership || membership.role !== "Organizer") {
    throw new PermissionError(
      `Access denied: Organizer role required for organization #${organizationId}`,
      403
    );
  }
  return membership;
}

/**
 * Require Member or Organizer role in the organization
 */
export async function assertMember(userId: number, organizationId: number) {
  const membership = await getUserOrgMembership(userId, organizationId);
  if (!membership) {
    throw new PermissionError(
      `Access denied: Active membership required for organization #${organizationId}`,
      403
    );
  }
  return membership;
}

/**
 * Anti-Self-Approval for Payouts
 * Spec Section 02 & 10:
 * 1. "The requester can never approve their own payout."
 * 2. "A payout requested by one organizer needs a different organizer to approve it."
 * 3. "With only one organizer, payouts above the org threshold go to a member vote."
 */
export async function assertCanApprovePayout(params: {
  payoutRecordId: number;
  approverUserId: number;
  organizationId: number;
}) {
  // 1. Verify approver is an Organizer
  await assertOrganizer(params.approverUserId, params.organizationId);

  // 2. Fetch payout record
  const payout = await db.query.payoutRecords.findFirst({
    where: eq(schema.payoutRecords.id, params.payoutRecordId),
    with: { pot: true },
  });

  if (!payout) {
    throw new PermissionError("Payout record not found", 404);
  }

  // 3. Rule: Requester cannot approve their own payout
  if (payout.requestedByUserId === params.approverUserId) {
    throw new PermissionError(
      "Anti-Self-Approval Violation: Requester cannot approve their own payout request.",
      403
    );
  }

  // 4. Count total organizers in the organization
  const organizers = await db.query.organizationMembers.findMany({
    where: and(
      eq(schema.organizationMembers.organizationId, params.organizationId),
      eq(schema.organizationMembers.role, "Organizer")
    ),
  });

  // Fetch active org rules for threshold
  const activeRule = await db.query.orgRules.findFirst({
    where: eq(schema.orgRules.organizationId, params.organizationId),
  });
  const dualApproverThreshold = activeRule?.payoutDualApproverThresholdCents ?? 25000;

  // Single-organizer threshold rule
  if (organizers.length <= 1 && payout.amountCents > dualApproverThreshold) {
    throw new PermissionError(
      `With only one organizer, payouts above $${(dualApproverThreshold / 100).toFixed(2)} must go to a member vote.`,
      403
    );
  }

  // 5. Check if user already submitted an approval decision
  const existingDecision = await db.query.payoutApprovals.findFirst({
    where: and(
      eq(schema.payoutApprovals.payoutRecordId, params.payoutRecordId),
      eq(schema.payoutApprovals.approverUserId, params.approverUserId)
    ),
  });

  if (existingDecision) {
    throw new PermissionError("You have already recorded a decision on this payout request.", 400);
  }

  return payout;
}

/**
 * Anti-Self-Approval for Payment Confirmations
 * Spec Section 02 & 05:
 * "A payment counts toward the goal only when both the payer and an organizer confirm it."
 * Neither side can confirm their own reported payment.
 */
export async function assertCanConfirmPayment(params: {
  paymentId: number;
  confirmingUserId: number;
  organizationId: number;
}) {
  const payment = await db.query.offlinePayments.findFirst({
    where: eq(schema.offlinePayments.id, params.paymentId),
  });

  if (!payment) {
    throw new PermissionError("Payment record not found", 404);
  }

  if (payment.status !== "pending_confirmation") {
    throw new PermissionError(
      `Payment record is already in '${payment.status}' state and cannot be confirmed.`,
      400
    );
  }

  // Rule: Cannot confirm own payment submission
  if (payment.initiatedByUserId === params.confirmingUserId) {
    throw new PermissionError(
      "Anti-Self-Approval Violation: You cannot confirm a payment transaction you initiated yourself.",
      403
    );
  }

  const membership = await getUserOrgMembership(params.confirmingUserId, params.organizationId);

  // If member marked "I sent $X", only an Organizer can confirm receipt
  if (payment.initiatedByRole === "Member") {
    if (!membership || membership.role !== "Organizer") {
      throw new PermissionError(
        "Only an Organizer can confirm receipt of a member-initiated payment.",
        403
      );
    }
  }

  // If organizer marked "Received $X from member", only the payer Member can confirm
  if (payment.initiatedByRole === "Organizer") {
    if (payment.payerUserId !== params.confirmingUserId) {
      throw new PermissionError(
        "Only the payer member can confirm an organizer-reported receipt.",
        403
      );
    }
  }

  return payment;
}

/**
 * COPPA Minor Data Protection Guardrail
 * Spec Section 13:
 * "Minors: no player accounts and no messages to players.
 *  Store only a player's first name and last initial plus team, under the parent's membership."
 */
export function assertCoppaCompliance(player: {
  firstName: string;
  lastInitial: string;
  hasAccount?: boolean;
  email?: string;
  phone?: string;
}) {
  if (player.hasAccount || player.email || player.phone) {
    throw new PermissionError(
      "COPPA Violation: Minors cannot have user accounts, email addresses, or phone numbers in V1.",
      400
    );
  }

  const trimmedInitial = player.lastInitial.trim();
  if (trimmedInitial.length === 0 || trimmedInitial.length > 2) {
    throw new PermissionError(
      "COPPA Requirement: Store only a player's first name and single last initial (e.g. 'Jordan M.').",
      400
    );
  }

  return true;
}

/**
 * Assistance Request Privacy Scope
 * Spec Section 07 & 13:
 * "Assistance privacy: help requests and repayment records are visible only to the member, organizers and any sponsor involved, unless the member opts to share."
 */
export function assertCanViewAssistanceRequest(params: {
  requestMemberUserId: number;
  visibility: string; // 'organizers_only' | 'organizers_and_group'
  requestingUserId: number;
  isOrganizer: boolean;
  isSponsor?: boolean;
}) {
  // 1. The member who made the request can always view it
  if (params.requestMemberUserId === params.requestingUserId) {
    return true;
  }

  // 2. Organizers can always view assistance requests
  if (params.isOrganizer) {
    return true;
  }

  // 3. A sponsor involved in this request can view it
  if (params.isSponsor) {
    return true;
  }

  // 4. If the member explicitly opted into 'organizers_and_group', members can see it
  if (params.visibility === "organizers_and_group") {
    return true;
  }

  // Otherwise, strictly private
  throw new PermissionError(
    "Privacy Violation: Assistance requests are strictly private by default.",
    403
  );
}

/**
 * Repayment Promise Privacy Scope
 * Spec Section 07 & 13:
 * "Only the member, the sponsor and organizers can see a repayment record."
 */
export function assertCanViewRepaymentRecord(params: {
  sponsorUserId: number;
  coveredMemberUserId: number;
  requestingUserId: number;
  isOrganizer: boolean;
}) {
  if (
    params.requestingUserId === params.sponsorUserId ||
    params.requestingUserId === params.coveredMemberUserId ||
    params.isOrganizer
  ) {
    return true;
  }

  throw new PermissionError(
    "Privacy Violation: Repayment records are only visible to the member, sponsor, and organizers.",
    403
  );
}

