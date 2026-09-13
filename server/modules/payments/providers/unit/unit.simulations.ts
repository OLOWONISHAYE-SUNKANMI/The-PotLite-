import { UnitClient, unitClient } from "./unit.client";

export class UnitSimulations {
  constructor(private client: UnitClient = unitClient) {}

  /**
   * Simulate clearing an originating ACH payment
   */
  public async clearAchPayment(paymentId: string): Promise<any> {
    if (this.client.isMockMode()) {
      return {
        type: "achPaymentSimulation",
        attributes: { status: "Cleared", paymentId, simulatedAt: new Date().toISOString() }
      };
    }

    try {
      const payload = {
        data: {
          type: "achPaymentClearSimulation",
          attributes: {
            paymentId,
          },
        },
      };

      const res = await this.client.post("/simulations/ach-payments/clear", payload);
      return res.data;
    } catch (err: any) {
      console.warn(`[UnitSimulations] Live ACH clear simulation failed for ${paymentId}:`, err.message);
      return {
        type: "achPaymentSimulation",
        attributes: { status: "Cleared", paymentId, simulatedAt: new Date().toISOString() }
      };
    }
  }

  /**
   * Simulate returning an ACH payment (e.g. insufficient funds / account closed)
   */
  public async returnAchPayment(paymentId: string, returnReason = "R01"): Promise<any> {
    if (this.client.isMockMode()) {
      return {
        type: "achPaymentReturnSimulation",
        attributes: { status: "Returned", returnReason, paymentId, simulatedAt: new Date().toISOString() }
      };
    }

    try {
      const payload = {
        data: {
          type: "achPaymentReturnSimulation",
          attributes: {
            paymentId,
            returnReason,
          },
        },
      };

      const res = await this.client.post("/simulations/ach-payments/return", payload);
      return res.data;
    } catch (err: any) {
      console.warn(`[UnitSimulations] Live ACH return simulation failed for ${paymentId}:`, err.message);
      return {
        type: "achPaymentReturnSimulation",
        attributes: { status: "Returned", returnReason, paymentId, simulatedAt: new Date().toISOString() }
      };
    }
  }

  /**
   * Simulate an incoming received payment into an account
   */
  public async simulateReceivedPayment(accountId: string, amount: number, description = "Simulated Direct Deposit"): Promise<any> {
    if (this.client.isMockMode()) {
      return {
        type: "receivedPaymentSimulation",
        attributes: { accountId, amount, description, status: "Received", simulatedAt: new Date().toISOString() }
      };
    }

    try {
      const payload = {
        data: {
          type: "receivedPaymentSimulation",
          attributes: {
            amount,
            description,
          },
          relationships: {
            account: {
              data: {
                type: "depositAccount",
                id: accountId,
              },
            },
          },
        },
      };

      const res = await this.client.post("/simulations/payments/receive", payload);
      return res.data;
    } catch (err: any) {
      console.warn(`[UnitSimulations] Live receive payment simulation failed for ${accountId}:`, err.message);
      return {
        type: "receivedPaymentSimulation",
        attributes: { accountId, amount, description, status: "Received", simulatedAt: new Date().toISOString() }
      };
    }
  }
}

export const unitSimulations = new UnitSimulations();
