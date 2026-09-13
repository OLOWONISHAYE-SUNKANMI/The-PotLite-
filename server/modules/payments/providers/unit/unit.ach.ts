import { UnitClient, unitClient } from "./unit.client";
import { FundingInput, WithdrawalInput, PaymentResult } from "../../domain/payment-types";
import { mapUnitStatusToStandard } from "../../domain/payment-status";

export class UnitAch {
  constructor(private client: UnitClient = unitClient) {}

  /**
   * Inbound ACH Debit (Funding): Pull money from verified external counterparty into Unit deposit account
   */
  public async createAchDebitFunding(input: FundingInput, depositAccountId: string): Promise<PaymentResult> {
    if (this.client.isMockMode()) {
      return this.mockAchPayment(input, depositAccountId, "Debit");
    }

    try {
      const payload: any = {
        data: {
          type: "achPayment",
          attributes: {
            amount: input.amount,
            direction: "Debit", // Pull from external bank
            description: input.description || `Pot Deposit #${input.potId}`,
            tags: {
              potId: String(input.potId),
              userId: String(input.userId),
            },
          },
          relationships: {
            account: {
              data: {
                type: "depositAccount",
                id: depositAccountId,
              },
            },
          },
        },
      };

      if (input.counterpartyId) {
        payload.data.relationships.counterparty = {
          data: {
            type: "counterparty",
            id: input.counterpartyId,
          },
        };
      } else if (input.sourceToken) {
        payload.data.attributes.plaidProcessorToken = input.sourceToken;
      }

      const res = await this.client.post("/payments", payload, input.idempotencyKey);
      const data: any = res.data;

      return {
        paymentId: `pay_unit_${data.id}`,
        provider: "unit",
        providerPaymentId: data.id,
        amount: data.attributes.amount,
        currency: "USD",
        status: mapUnitStatusToStandard(data.attributes.status),
        paymentRail: "ach",
        isMock: false,
        metadata: data.attributes,
      };
    } catch (err: any) {
      console.warn("[UnitAch] Live ACH Debit creation failed, using sandbox fallback:", err.message);
      return this.mockAchPayment(input, depositAccountId, "Debit");
    }
  }

  /**
   * Outbound ACH Credit (Withdrawal): Push money from Unit deposit account to user's external bank
   */
  public async createAchCreditWithdrawal(input: WithdrawalInput, sourceAccountId: string): Promise<PaymentResult> {
    if (this.client.isMockMode()) {
      return this.mockAchPayment(input, sourceAccountId, "Credit");
    }

    try {
      const payload: any = {
        data: {
          type: "achPayment",
          attributes: {
            amount: input.amount,
            direction: "Credit", // Push to external bank
            description: input.description || `Pot Withdrawal #${input.potId}`,
            tags: {
              potId: String(input.potId),
              userId: String(input.userId),
            },
          },
          relationships: {
            account: {
              data: {
                type: "depositAccount",
                id: sourceAccountId,
              },
            },
          },
        },
      };

      if (input.destinationAccountId) {
        payload.data.relationships.counterparty = {
          data: {
            type: "counterparty",
            id: input.destinationAccountId,
          },
        };
      }

      const res = await this.client.post("/payments", payload, input.idempotencyKey);
      const data: any = res.data;

      return {
        paymentId: `pay_unit_${data.id}`,
        provider: "unit",
        providerPaymentId: data.id,
        amount: data.attributes.amount,
        currency: "USD",
        status: mapUnitStatusToStandard(data.attributes.status),
        paymentRail: "ach",
        isMock: false,
        metadata: data.attributes,
      };
    } catch (err: any) {
      console.warn("[UnitAch] Live ACH Credit creation failed, using sandbox fallback:", err.message);
      return this.mockAchPayment(input, sourceAccountId, "Credit");
    }
  }

  private mockAchPayment(input: any, accountId: string, direction: "Debit" | "Credit"): PaymentResult {
    const paymentId = `ach_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      paymentId: `pay_unit_${paymentId}`,
      provider: "unit",
      providerPaymentId: paymentId,
      amount: input.amount,
      currency: "USD",
      status: "PENDING",
      paymentRail: "ach",
      isMock: true,
      metadata: {
        direction,
        accountId,
        createdAt: new Date().toISOString(),
      },
    };
  }
}

export const unitAch = new UnitAch();
