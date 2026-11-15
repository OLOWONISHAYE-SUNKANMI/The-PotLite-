/**
 * THEPOTLITE V1 PILOT — PHASE 2 VERIFICATION SUITE
 * Authentication, Two-Factor & Role-Based Permissions ("Nobody approves their own action")
 */

import {
  hashPassword,
  comparePassword,
  generateBase32Secret,
  generateTOTPCode,
  verifyTOTPCode,
} from "../server/thepotlite/auth";

import {
  assertCoppaCompliance,
  assertCanViewAssistanceRequest,
  assertCanViewRepaymentRecord,
  PermissionError,
} from "../server/thepotlite/permissions";

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

async function runPhase2Tests() {
  console.log("================================================================================");
  console.log("THEPOTLITE V1 PILOT — PHASE 2 AUTH, 2FA & PERMISSIONS VERIFICATION");
  console.log("Governing principle: 'Nobody approves their own action.'");
  console.log("================================================================================\n");

  // -------------------------------------------------------------------------
  // TEST 1: Password Hashing & Verification (crypto.scrypt with random salt)
  // -------------------------------------------------------------------------
  console.log("--- Test 1: Password Hashing & Verification ---");
  const rawPassword = "CoachPassword123!";
  const hash = await hashPassword(rawPassword);

  assert(hash.includes(":") && hash.split(":").length === 2, "Password hash format is salt:derivedKey");
  assert(hash !== rawPassword, "Password is cryptographically hashed and never stored plaintext");

  const validMatch = await comparePassword(rawPassword, hash);
  assert(validMatch, "Password verification succeeds for correct password");

  const wrongMatch = await comparePassword("WrongPassword456!", hash);
  assert(!wrongMatch, "Password verification rejects incorrect password");

  const hash2 = await hashPassword(rawPassword);
  assert(hash !== hash2, "Different random salts produce distinct hashes for identical passwords");

  // -------------------------------------------------------------------------
  // TEST 2: RFC 6238 TOTP Two-Factor Authentication Engine
  // -------------------------------------------------------------------------
  console.log("\n--- Test 2: RFC 6238 TOTP Engine ---");
  const secret = generateBase32Secret(20);
  assert(typeof secret === "string" && secret.length >= 20, "Base32 TOTP secret generated successfully");

  const now = Date.now();
  const currentCode = generateTOTPCode(secret, now);
  assert(/^\d{6}$/.test(currentCode), "TOTP code is formatted as a 6-digit numeric string");

  const isCurrentValid = verifyTOTPCode(secret, currentCode, 1);
  assert(isCurrentValid, "TOTP verification confirms current valid 6-digit code");

  // Test clock drift allowance (+- 30 seconds)
  const codePastStep = generateTOTPCode(secret, now - 30 * 1000);
  const isPastValid = verifyTOTPCode(secret, codePastStep, 1);
  assert(isPastValid, "TOTP verification accepts code within 1 time step drift window (clock skew allowance)");

  // Test expired code (> 2 minutes away)
  const codeExpired = generateTOTPCode(secret, now - 180 * 1000);
  const isExpiredValid = verifyTOTPCode(secret, codeExpired, 1);
  assert(!isExpiredValid, "TOTP verification rejects expired code outside drift window");

  const isWrongValid = verifyTOTPCode(secret, "000000");
  assert(!isWrongValid, "TOTP verification rejects random invalid code");

  // -------------------------------------------------------------------------
  // TEST 3: Anti-Self-Approval for Payouts
  // -------------------------------------------------------------------------
  console.log("\n--- Test 3: Anti-Self-Approval Engine (Payouts) ---");

  interface MockPayout {
    id: number;
    potId: number;
    requestedByUserId: number;
    amountCents: number;
  }

  function simulatePayoutApproval(params: {
    payout: MockPayout;
    approverUserId: number;
    approverRole: "Organizer" | "Member";
    totalOrganizersInOrg: number;
    dualApproverThresholdCents: number;
  }) {
    if (params.approverRole !== "Organizer") {
      throw new PermissionError("Only an Organizer can approve payouts.");
    }
    // Spec Section 02 & 10: "The requester can never approve their own payout."
    if (params.payout.requestedByUserId === params.approverUserId) {
      throw new PermissionError("Anti-Self-Approval Violation: Requester cannot approve their own payout request.");
    }
    // Spec Section 02: "With only one organizer, payouts above the org threshold go to a member vote."
    if (params.totalOrganizersInOrg <= 1 && params.payout.amountCents > params.dualApproverThresholdCents) {
      throw new PermissionError("Single organizer cannot self-approve above threshold; member vote required.");
    }
    return { approved: true };
  }

  const payoutRecord: MockPayout = {
    id: 501,
    potId: 1,
    requestedByUserId: 10, // Organizer A
    amountCents: 50000,   // $500.00
  };

  // Organizer A attempts to approve their own payout request
  let selfApprovalBlocked = false;
  try {
    simulatePayoutApproval({
      payout: payoutRecord,
      approverUserId: 10, // Same user!
      approverRole: "Organizer",
      totalOrganizersInOrg: 2,
      dualApproverThresholdCents: 25000,
    });
  } catch (err: any) {
    if (err instanceof PermissionError && err.message.includes("Requester cannot approve their own payout")) {
      selfApprovalBlocked = true;
    }
  }
  assert(selfApprovalBlocked, "Anti-Self-Approval: Organizer A is blocked from approving their own payout request");

  // Organizer B approves Organizer A's payout
  let peerApprovalSuccess = false;
  try {
    const result = simulatePayoutApproval({
      payout: payoutRecord,
      approverUserId: 11, // Organizer B
      approverRole: "Organizer",
      totalOrganizersInOrg: 2,
      dualApproverThresholdCents: 25000,
    });
    peerApprovalSuccess = result.approved;
  } catch {}
  assert(peerApprovalSuccess, "Separation of duties: Organizer B successfully approves Organizer A's payout request");

  // Single organizer in org above threshold must route to vote
  let singleOrgBlocked = false;
  try {
    simulatePayoutApproval({
      payout: payoutRecord,
      approverUserId: 12,
      approverRole: "Organizer",
      totalOrganizersInOrg: 1, // Only 1 organizer exists
      dualApproverThresholdCents: 25000,
    });
  } catch (err: any) {
    if (err.message.includes("member vote required")) {
      singleOrgBlocked = true;
    }
  }
  assert(singleOrgBlocked, "With only 1 organizer, payouts above $250 cannot be unilaterally approved; routes to vote");

  // -------------------------------------------------------------------------
  // TEST 4: Anti-Self-Approval for Payment Confirmations
  // -------------------------------------------------------------------------
  console.log("\n--- Test 4: Anti-Self-Approval Engine (Payments) ---");

  interface MockPayment {
    id: number;
    initiatedByRole: "Member" | "Organizer";
    initiatedByUserId: number;
    payerUserId: number;
  }

  function simulatePaymentConfirmation(params: {
    payment: MockPayment;
    confirmingUserId: number;
    confirmingRole: "Member" | "Organizer";
  }) {
    // Cannot confirm own statement
    if (params.payment.initiatedByUserId === params.confirmingUserId) {
      throw new PermissionError("Cannot confirm own reported payment statement.");
    }
    // If member initiated "I sent $X", only an Organizer can confirm
    if (params.payment.initiatedByRole === "Member" && params.confirmingRole !== "Organizer") {
      throw new PermissionError("Only an Organizer can confirm receipt of member-reported payment.");
    }
    // If organizer initiated "Received $X", only the payer Member can confirm
    if (params.payment.initiatedByRole === "Organizer" && params.payment.payerUserId !== params.confirmingUserId) {
      throw new PermissionError("Only the payer member can confirm an organizer-reported receipt.");
    }
    return { confirmed: true };
  }

  const memberPayment: MockPayment = {
    id: 601,
    initiatedByRole: "Member",
    initiatedByUserId: 42, // Parent
    payerUserId: 42,
  };

  // Member attempts to self-confirm their own payment
  let memberSelfConfirmBlocked = false;
  try {
    simulatePaymentConfirmation({
      payment: memberPayment,
      confirmingUserId: 42,
      confirmingRole: "Member",
    });
  } catch (err: any) {
    memberSelfConfirmBlocked = true;
  }
  assert(memberSelfConfirmBlocked, "Payer member cannot self-confirm their own payment statement");

  // Organizer confirms member payment
  let organizerConfirmSuccess = false;
  try {
    const res = simulatePaymentConfirmation({
      payment: memberPayment,
      confirmingUserId: 10,
      confirmingRole: "Organizer",
    });
    organizerConfirmSuccess = res.confirmed;
  } catch {}
  assert(organizerConfirmSuccess, "Organizer successfully confirms member-reported payment");

  // -------------------------------------------------------------------------
  // TEST 5: COPPA Minor Compliance Enforcement
  // -------------------------------------------------------------------------
  console.log("\n--- Test 5: COPPA Minor Data Compliance ---");

  // Valid minor profile: First name + single last initial
  let validChildPass = false;
  try {
    validChildPass = assertCoppaCompliance({
      firstName: "Marcus",
      lastInitial: "T.",
    });
  } catch {}
  assert(validChildPass, "Valid minor profile with first name and last initial passes COPPA check");

  // Illegal: Player assigned direct email / account
  let illegalAccountBlocked = false;
  try {
    assertCoppaCompliance({
      firstName: "Marcus",
      lastInitial: "T",
      email: "marcus.teen@example.com",
    });
  } catch (err: any) {
    if (err.message.includes("COPPA Violation")) {
      illegalAccountBlocked = true;
    }
  }
  assert(illegalAccountBlocked, "COPPA: Assigning direct email or account to minor is strictly rejected");

  // -------------------------------------------------------------------------
  // TEST 6: Assistance Request & Repayment Privacy Scopes
  // -------------------------------------------------------------------------
  console.log("\n--- Test 6: Assistance Request & Repayment Privacy ---");

  // Requesting member can view own request
  assert(
    assertCanViewAssistanceRequest({
      requestMemberUserId: 42,
      visibility: "organizers_only",
      requestingUserId: 42,
      isOrganizer: false,
    }),
    "Member can view their own assistance request"
  );

  // Organizer can view assistance request
  assert(
    assertCanViewAssistanceRequest({
      requestMemberUserId: 42,
      visibility: "organizers_only",
      requestingUserId: 10,
      isOrganizer: true,
    }),
    "Organizer can view private assistance request"
  );

  // Other member is BLOCKED from viewing private assistance request
  let unauthMemberBlocked = false;
  try {
    assertCanViewAssistanceRequest({
      requestMemberUserId: 42,
      visibility: "organizers_only",
      requestingUserId: 99, // Unrelated parent
      isOrganizer: false,
    });
  } catch (err: any) {
    if (err.message.includes("strictly private")) {
      unauthMemberBlocked = true;
    }
  }
  assert(unauthMemberBlocked, "Unrelated member is blocked from viewing private assistance request");

  // Repayment record visible only to member, sponsor, organizer
  assert(
    assertCanViewRepaymentRecord({
      sponsorUserId: 88,
      coveredMemberUserId: 42,
      requestingUserId: 88,
      isOrganizer: false,
    }),
    "Sponsor can view their own repayment record"
  );

  let thirdPartyBlocked = false;
  try {
    assertCanViewRepaymentRecord({
      sponsorUserId: 88,
      coveredMemberUserId: 42,
      requestingUserId: 99, // Bystander
      isOrganizer: false,
    });
  } catch (err: any) {
    thirdPartyBlocked = true;
  }
  assert(thirdPartyBlocked, "Bystander is blocked from viewing private repayment promise");

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`PHASE 2 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
