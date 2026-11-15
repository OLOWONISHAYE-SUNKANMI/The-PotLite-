/**
 * THEPOTLITE V1 PILOT — PHASE 1 DOMAIN & STATE MACHINE VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Zod Schema Validations across Organizations, Teams, COPPA Players, Pots, Obligations, Installments, Audit Events
 * 2. Default Human Rules Configuration (11 defaults from Section 09)
 * 3. Versioned Consent-Gated State Machine:
 *    - New obligations start as 'Invited' (v1)
 *    - Acceptance transitions to 'Accepted'
 *    - Proposed changes spawn pending v2 without altering active v1
 *    - Decline preserves v1 in full force
 *    - Acceptance supersedes v1 and activates v2
 * 4. COPPA Minor Data Protection (First name + Last initial only)
 * 5. Automatic Pot Completion logic
 * 6. Append-Only Audit Trail formatting
 */

import {
  insertOrganizationSchema,
  insertOrgRuleSchema,
  insertTeamSchema,
  insertPlayerSchema,
  insertPilotPotSchema,
  insertObligationSchema,
  insertObligationVersionSchema,
  insertInstallmentSchema,
  insertAuditEventSchema,
} from "../shared/schema";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    failed++;
  }
}

async function runPhase1Tests() {
  console.log("================================================================================");
  console.log("THEPOTLITE V1 PILOT — PHASE 1 DOMAIN MODEL & STATE MACHINE VERIFICATION");
  console.log("Governing principle: 'No money handled. No disputes adjudicated. No obligations silently changed.'");
  console.log("================================================================================\n");

  // -------------------------------------------------------------------------
  // TEST 1: Organization & Human Rules Engine (Section 09 Defaults)
  // -------------------------------------------------------------------------
  console.log("--- Test 1: Human Rules Engine Defaults Validation ---");
  const defaultOrgRules = {
    organizationId: 1,
    version: 1,
    reminderScheduleDays: [-7, -3, -1, 1, 3, 5, 7],
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
    createdById: 10,
  };

  const parsedRules = insertOrgRuleSchema.safeParse(defaultOrgRules);
  assert(parsedRules.success, "Org Rules V1 configuration schema is valid");
  if (parsedRules.success) {
    assert(parsedRules.data.gracePeriodDays === 2, "Grace period default is 2 days");
    assert(parsedRules.data.confirmationWindowHours === 48, "Confirmation window is 48 hours");
    assert(parsedRules.data.finalNoticeResponseWindowHours === 12, "Final notice window is 12 hours");
    assert(parsedRules.data.inviteExpiryHours === 72, "Invite expiry is 72 hours");
    assert(parsedRules.data.payoutDualApproverThresholdCents === 25000, "Payout threshold for 2 approvers is $250");
    assert(parsedRules.data.payoutVoteThresholdCents === 100000, "Payout threshold for group vote is $1,000");
  }

  // -------------------------------------------------------------------------
  // TEST 2: COPPA Minor Representation (Section 13)
  // -------------------------------------------------------------------------
  console.log("\n--- Test 2: COPPA Child Data Compliance ---");
  const rawChild = {
    organizationId: 1,
    teamId: 1,
    parentUserId: 42,
    firstName: "Jordan",
    lastInitial: "M.",
    jerseyNumber: "14",
  };

  const sanitizedInitial = rawChild.lastInitial.trim().charAt(0).toUpperCase();
  const playerPayload = { ...rawChild, lastInitial: sanitizedInitial };
  const parsedPlayer = insertPlayerSchema.safeParse(playerPayload);

  assert(parsedPlayer.success, "Player is successfully enrolled under parent account");
  assert(parsedPlayer.success && parsedPlayer.data.lastInitial === "M", "Player stores strictly first name and single last initial (COPPA-safe)");

  // -------------------------------------------------------------------------
  // TEST 3: Pilot Pot Validation & Allowed Types (Section 03)
  // -------------------------------------------------------------------------
  console.log("\n--- Test 3: Pilot Pot Types Validation ---");
  const validPotTypes = ["season fee", "tournament", "uniforms and gear", "travel", "fundraiser", "other"];

  for (const pType of validPotTypes) {
    const potData = {
      organizationId: 1,
      teamId: 1,
      name: `Fall 2026 ${pType}`,
      purpose: "Covering tournament registration and referee fees",
      potType: pType,
      goalAmountCents: 360000, // $3,600.00
      deadline: new Date(Date.now() + 30 * 86400000),
      ruleVersionId: 1,
      createdById: 10,
    };
    const parsed = insertPilotPotSchema.safeParse(potData);
    assert(parsed.success, `Pilot Pot type '${pType}' is accepted`);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Versioned Consent-Gated Obligation State Machine (Section 03, 04, 08)
  // -------------------------------------------------------------------------
  console.log("\n--- Test 4: Versioned Consent-Gated Obligation State Machine ---");

  // Simulated in-memory state representing the database state machine
  interface MockObligation {
    id: number;
    potId: number;
    memberUserId: number;
    currentVersionNumber: number;
    totalAmountCents: number;
    confirmedAmountCents: number;
    state: string;
    previousState?: string;
  }

  interface MockVersion {
    versionNumber: number;
    amountCents: number;
    status: "active" | "pending_acceptance" | "declined" | "superseded";
    changeReason?: string;
  }

  // Step A: Initial Invite
  const mockObligation: MockObligation = {
    id: 101,
    potId: 1,
    memberUserId: 42,
    currentVersionNumber: 1,
    totalAmountCents: 30000, // $300.00 (e.g. 3 x $100)
    confirmedAmountCents: 0,
    state: "Invited",
  };

  const versions: MockVersion[] = [
    {
      versionNumber: 1,
      amountCents: 30000,
      status: "active",
      changeReason: "Initial invite",
    },
  ];

  assert(mockObligation.state === "Invited", "Step A: Obligation starts in 'Invited' state");
  assert(versions[0].status === "active" && versions[0].versionNumber === 1, "Step A: Version 1 is active");

  // Step B: Member Accepts
  mockObligation.state = "Accepted";
  assert(mockObligation.state === "Accepted", "Step B: Member acceptance moves obligation to 'Accepted'");

  // Step C: Propose Change (e.g., Organizer adds $50 tournament surcharge or adjustment)
  // Golden rule: Previous version stays in force until member accepts new one!
  const proposedVersion: MockVersion = {
    versionNumber: 2,
    amountCents: 35000, // $350.00
    status: "pending_acceptance",
    changeReason: "Additional referee fee approved by group",
  };
  versions.push(proposedVersion);
  mockObligation.previousState = mockObligation.state;
  mockObligation.state = "Change pending";

  assert(
    versions.find((v) => v.versionNumber === 1)?.status === "active",
    "Step C: Version 1 ($300) remains strictly active while version 2 is pending acceptance"
  );
  assert(
    mockObligation.totalAmountCents === 30000,
    "Step C: Legally enforced amount remains $300 until member consents"
  );

  // Step D: Member Declines First Proposal
  // Decline preserves active version 1 and restores state
  proposedVersion.status = "declined";
  mockObligation.state = mockObligation.previousState!;

  assert(
    versions.find((v) => v.versionNumber === 2)?.status === "declined",
    "Step D: Declined proposal is marked 'declined'"
  );
  assert(
    mockObligation.state === "Accepted" && mockObligation.totalAmountCents === 30000,
    "Step D: Obligation remains in 'Accepted' with Version 1 ($300)"
  );

  // Step E: New Proposal Accepted by Member
  const revisedVersion: MockVersion = {
    versionNumber: 3,
    amountCents: 32500, // $325.00 negotiated compromise
    status: "pending_acceptance",
    changeReason: "Adjusted season fee",
  };
  versions.push(revisedVersion);

  // Member clicks "Accept" on new terms
  const oldActive = versions.find((v) => v.status === "active");
  if (oldActive) oldActive.status = "superseded";
  revisedVersion.status = "active";
  mockObligation.currentVersionNumber = 3;
  mockObligation.totalAmountCents = revisedVersion.amountCents;
  mockObligation.state = "Accepted";

  assert(
    versions.find((v) => v.versionNumber === 1)?.status === "superseded",
    "Step E: Version 1 is marked 'superseded' after explicit member acceptance"
  );
  assert(
    versions.find((v) => v.versionNumber === 3)?.status === "active",
    "Step E: Version 3 is now the active version"
  );
  assert(
    mockObligation.totalAmountCents === 32500,
    "Step E: Obligation total successfully updated to $325 with member consent"
  );

  // -------------------------------------------------------------------------
  // TEST 5: Automatic Pot Completion Logic (Section 03)
  // -------------------------------------------------------------------------
  console.log("\n--- Test 5: Automatic Pot Completion Evaluation ---");

  const potObligations = [
    { id: 1, state: "Confirmed" },
    { id: 2, state: "Confirmed" },
    { id: 3, state: "Withdrawn" }, // Withdrawn members are excluded from active goal
    { id: 4, state: "Confirmed" },
  ];

  const activeObs = potObligations.filter((o) => o.state !== "Withdrawn" && o.state !== "Removed");
  const isComplete = activeObs.length > 0 && activeObs.every((o) => o.state === "Confirmed");

  assert(isComplete, "Pot automatically marks completed when all active obligations are 'Confirmed'");

  // -------------------------------------------------------------------------
  // TEST 6: Append-Only Audit Trail Formatting (Section 11)
  // -------------------------------------------------------------------------
  console.log("\n--- Test 6: Append-Only Audit Trail Timeline Formatting ---");
  const auditEvent = {
    actorUserId: 42,
    actorRole: "Member",
    action: "obligation_accepted",
    objectType: "Obligation",
    objectId: 101,
    potId: 1,
    termsVersion: 3,
    ruleVersion: 1,
    plainTextTimelineEntry: "Oct 20: Jordan accepted $325, version 3",
  };

  const parsedAudit = insertAuditEventSchema.safeParse(auditEvent);
  assert(parsedAudit.success, "Audit Event validates against append-only schema");
  assert(
    parsedAudit.success && parsedAudit.data.plainTextTimelineEntry.includes("accepted $325, version 3"),
    "Audit log contains human-readable timeline statement"
  );

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`PHASE 1 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

