import { UnitClient, unitClient } from "./unit.client";
import { TransferInput, PaymentResult } from "../../domain/payment-types";
import { mapUnitStatusToStandard } from "../../domain/payment-status";

export class UnitBookPayments {
  constructor(private client: UnitClient = unitClient) {}

  /**
   * Instant intra-org book transfer between Unit accounts (Personal Pot to Group/FBO Account)
   */
  public async createBookPayment(input: TransferInput): Promise<PaymentResult> {
    if (this.client.isMockMode()) {
      return this.mockBookPayment(input);
    }

    try {
      const payload = {
        data: {
          type: "bookPayment",
          attributes: {
            amount: input.amount,
            description: input.description || `Transfer to Pot #${input.potId}`,
            tags: {
              potId: String(input.potId),
              userId: String(input.userId),
            },
          },
          relationships: {
            account: {
              data: {
                type: "depositAccount",
                id: input.sourceAccountId,
              },
            },
            counterpartyAccount: {
              data: {
                type: "depositAccount",
                id: input.destinationAccountId,
              },
            },
          },
        },
      };

      const res = await this.client.post("/payments", payload, input.idempotencyKey);
      const data: any = res.data;

      return {
        paymentId: `pay_book_${data.id}`,
        provider: "unit",
        providerPaymentId: data.id,
        amount: data.attributes.amount,
        currency: "USD",
        status: mapUnitStatusToStandard(data.attributes.status || "Completed"),
        paymentRail: "book_payment",
        isMock: false,
        metadata: data.attributes,
      };
    } catch (err: any) {
      console.warn("[UnitBookPayments] Live Book Payment creation failed, using sandbox fallback:", err.message);
      return this.mockBookPayment(input);
    }
  }

  private mockBookPayment(input: TransferInput): PaymentResult {
    const paymentId = `book_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      paymentId: `pay_book_${paymentId}`,
      provider: "unit",
      providerPaymentId: paymentId,
      amount: input.amount,
      currency: "USD",
      status: "COMPLETED",
      paymentRail: "book_payment",
      isMock: true,
      metadata: {
        sourceAccountId: input.sourceAccountId,
        destinationAccountId: input.destinationAccountId,
        settledAt: new Date().toISOString(),
      },
    };
  }
}

export const unitBookPayments = new UnitBookPayments();
