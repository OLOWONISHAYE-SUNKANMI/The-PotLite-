import { moovWebhooks } from "./moov.webhooks";
import { moovTransfers } from "./moov.transfers";
import { ledgerService } from "../../services/ledger.service";
import * as storage from "../../../../storage";

export class MoovSimulations {
  /**
   * Simulate a Moov transfer transitioning to 'completed'
   */
  public async simulateTransferCompleted(transferId: string, potId = 1, amount = 2500) {
    const eventPayload = {
      eventID: `sim_evt_${Date.now()}`,
      type: "transfer.updated",
      data: {
        transferID: transferId,
        status: "completed",
        amount: {
          currency: "USD",
          value: amount,
        },
        metadata: {
          potId: String(potId),
          simulated: "true",
        },
      },
    };

    return await moovWebhooks.handleWebhook(JSON.stringify(eventPayload));
  }

  /**
   * Simulate a Moov transfer failure or ACH return
   */
  public async simulateTransferFailed(transferId: string, reason = "R01_INSUFFICIENT_FUNDS") {
    const eventPayload = {
      eventID: `sim_evt_${Date.now()}`,
      type: "transfer.updated",
      data: {
        transferID: transferId,
        status: "failed",
        failureReason: reason,
        metadata: {
          simulated: "true",
        },
      },
    };

    return await moovWebhooks.handleWebhook(JSON.stringify(eventPayload));
  }

  /**
   * Simulate rapid-fire deposits for sandbox stress testing
   */
  public async stressTestInboundAch(potId: number, count = 5, amountEach = 1000) {
    const results = [];
    for (let i = 0; i < count; i++) {
      const res = await moovTransfers.createAchDebitFunding({
        potId,
        userId: 1,
        amount: amountEach,
        paymentRail: "ach",
        description: `Stress test deposit batch #${i + 1}`,
      });
      results.push(res);
    }
    return {
      status: "success",
      totalTransactions: count,
      totalAmount: count * amountEach,
      results,
    };
  }
}

export const moovSimulations = new MoovSimulations();
