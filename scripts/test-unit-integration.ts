if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {}
}

import {
  unitProvider,
  stripeProvider,
  paymentOrchestrator,
  feeEngine,
  reconciliationService,
  unitClient,
} from "../server/modules/payments";

async function runTests() {
  console.log("=================================================");
  console.log("THE POT (TP) — UNIT PRIMARY INTEGRATION TEST SUITE");
  console.log("=================================================");

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

  try {
    // Test 1: Unit Client Configuration
    console.log("\n--- Test 1: Unit Client Setup ---");
    assert(unitClient.getBaseUrl() === "https://api.s.unit.sh", "Unit Base URL points to Sandbox");
    assert(unitClient.getToken().startsWith("v2.public."), "Unit Token is configured with PASETO v2 Public Token");

    // Test 2: Fee Engine & Commercial Rules ($100+ fee waiver)
    console.log("\n--- Test 2: Fee Engine Commercial Rules ---");
    const standardFee = feeEngine.calculateFee(5000, 0, false); // $50 deposit
    assert(standardFee.platformFee === 100, "Standard $50 deposit incurs 2% fee ($1.00)", `Got ${standardFee.platformFee}`);
    assert(!standardFee.isFeeWaived, "Fee is not waived for < $100");

    const waivedFee = feeEngine.calculateFee(10000, 0, false); // $100 deposit
    assert(waivedFee.platformFee === 0, "$100+ deposit has $0 platform fee", `Got ${waivedFee.platformFee}`);
    assert(waivedFee.isFeeWaived === true, "$100+ Personal Pot benefit fee waiver applied");

    // Test 3: Customer Provisioning
    console.log("\n--- Test 3: Customer Provisioning ---");
    const customer = await unitProvider.createCustomer({
      userId: 1,
      email: "maurice@thepot.com",
      fullName: "Maurice Lewis Jr",
    });
    assert(Boolean(customer.customerId), `Customer created with ID: ${customer.customerId}`);
    assert(customer.provider === "unit", "Provider is correctly tagged as 'unit'");

    // Test 4: Deposit Checking Account Creation & Mapping
    console.log("\n--- Test 4: Deposit Account Provisioning ---");
    const account = await unitProvider.createAccount({
      userId: 1,
      potId: 1,
      customerId: customer.customerId,
      productType: "checking",
    });
    assert(Boolean(account.accountId), `Deposit Account created with ID: ${account.accountId}`);
    assert(account.depositProduct === "checking", "Account is checking deposit product");
    assert(Boolean(account.routingNumber), `Routing Number present: ${account.routingNumber}`);

    // Test 5: Account & Balance Retrieval
    console.log("\n--- Test 5: Account Details & Balance ---");
    const balance = await unitProvider.getBalance(account.accountId);
    assert(balance.provider === "unit", "Balance provider is Unit");
    assert(typeof balance.balance === "number", `Balance is integer cents: ${balance.balance}`);

    // Test 6: Inbound ACH Debit Funding via Orchestrator
    console.log("\n--- Test 6: Inbound ACH Funding (Primary Rail) ---");
    const fundingResult = await paymentOrchestrator.fundPot({
      userId: 1,
      potId: 1,
      amount: 15000, // $150.00
      paymentRail: "ach",
      description: "Test ACH Pot Contribution",
    });
    assert(fundingResult.provider === "unit", "Funding was routed to Unit as Primary");
    assert(fundingResult.paymentRail === "ach", "Payment rail is ACH");
    assert(fundingResult.feeBreakdown.isFeeWaived === true, "Fee waiver honored in orchestrator");

    // Test 7: Intra-Org Book Payment (Personal to Group Pot)
    console.log("\n--- Test 7: Unit Book Payment (Instant Internal Transfer) ---");
    const bookResult = await paymentOrchestrator.transferBetweenPots({
      userId: 1,
      potId: 1,
      amount: 5000, // $50.00
      sourceAccountId: "22170443",
      destinationAccountId: "22170444",
      description: "Book transfer from Personal to Group Pot",
    });
    assert(bookResult.provider === "unit", "Book payment executed via Unit");
    assert(bookResult.paymentRail === "book_payment", "Payment rail is book_payment");

    // Test 8: Outbound ACH Credit Withdrawal
    console.log("\n--- Test 8: Outbound ACH Withdrawal ---");
    const withdrawalResult = await paymentOrchestrator.withdrawFromPot({
      userId: 1,
      potId: 1,
      amount: 2500, // $25.00
      description: "Withdrawal to external bank",
    });
    assert(withdrawalResult.provider === "unit", "Withdrawal routed to Unit ACH Credit");
    assert(withdrawalResult.paymentRail === "ach", "Rail is ACH");

    // Test 9: Unit Webhook Handling
    console.log("\n--- Test 9: Webhook Processing & Deduplication ---");
    const mockWebhookPayload = JSON.stringify({
      data: {
        type: "event",
        id: `evt_test_${Date.now()}`,
        attributes: {
          type: "payment.cleared",
          createdAt: new Date().toISOString(),
        },
        relationships: {
          payment: {
            data: {
              type: "payment",
              id: fundingResult.providerPaymentId,
            },
          },
        },
      },
    });

    const webhookResult = await unitProvider.handleWebhook(mockWebhookPayload);
    assert(webhookResult.received === true, "Webhook event was received and parsed");
    assert(webhookResult.status === "processed", "Webhook event processed successfully");

    // Duplicate webhook test
    const duplicateResult = await unitProvider.handleWebhook(mockWebhookPayload);
    assert(duplicateResult.status === "already_processed", "Duplicate webhook safely ignored via idempotency check");

    // Test 10: Multi-Provider Reconciliation Audit
    console.log("\n--- Test 10: Reconciliation Engine ---");
    const recReport = await reconciliationService.runReconciliation("all");
    assert(recReport.status === "COMPLETED", "Reconciliation run completed successfully");
    assert(recReport.totalChecked >= 0, `Audited ${recReport.totalChecked} records`);

    // Test 11: Stripe Co-existence & Readiness
    console.log("\n--- Test 11: Secondary Provider (Stripe) Co-existence ---");
    assert(stripeProvider.provider === "stripe", "Stripe provider is available");
    assert(stripeProvider.isReady(), "Stripe provider is ready for card payments");

    console.log("\n=================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error("Test Suite crashed:", error);
    process.exit(1);
  }
}

runTests();
