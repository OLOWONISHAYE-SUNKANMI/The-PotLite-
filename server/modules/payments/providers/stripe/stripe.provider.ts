import { PaymentProvider } from "../../domain/payment-provider.interface";
import {
  CreateCustomerInput,
  CustomerResult,
  CreateAccountInput,
  AccountResult,
  FundingInput,
  WithdrawalInput,
  TransferInput,
  PaymentResult,
  BalanceResult,
  TransactionResult,
  WebhookResult,
} from "../../domain/payment-types";
import { ProviderType } from "../../domain/payment-status";
import { stripeService } from "../../../../stripe/stripe.service";
import { processStripeWebhook } from "../../../../stripe/webhook.handler";

export class StripeProvider implements PaymentProvider {
  public readonly provider: ProviderType = "stripe";

  public isReady(): boolean {
    return true;
  }

  public isMockMode(): boolean {
    return stripeService.isMockMode();
  }

  public async createCustomer(input: CreateCustomerInput): Promise<CustomerResult> {
    return {
      customerId: `cus_stripe_${input.userId}_${Date.now()}`,
      provider: "stripe",
      status: "active",
      isMock: stripeService.isMockMode(),
    };
  }

  public async createAccount(input: CreateAccountInput): Promise<AccountResult> {
    return {
      accountId: `acct_stripe_${input.userId}`,
      provider: "stripe",
      accountType: "connected_account",
      status: "active",
      balance: 0,
      availableBalance: 0,
      currency: "USD",
      isMock: stripeService.isMockMode(),
    };
  }

  public async getAccount(accountId: string): Promise<AccountResult> {
    return {
      accountId,
      provider: "stripe",
      accountType: "connected_account",
      status: "active",
      balance: 0,
      availableBalance: 0,
      currency: "USD",
      isMock: stripeService.isMockMode(),
    };
  }

  public async getBalance(accountId: string): Promise<BalanceResult> {
    return {
      accountId,
      provider: "stripe",
      balance: 0,
      availableBalance: 0,
      hold: 0,
      currency: "USD",
    };
  }

  public async createFunding(input: FundingInput): Promise<PaymentResult> {
    // Uses Stripe PaymentIntent for Card funding
    const intent = await stripeService.createPaymentIntent({
      amount: input.amount,
      currency: input.currency || "USD",
      potId: input.potId,
      userId: input.userId,
      description: input.description,
    });

    return {
      paymentId: `pay_stripe_${intent.paymentIntentId}`,
      provider: "stripe",
      providerPaymentId: intent.paymentIntentId,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status === "succeeded" ? "COMPLETED" : "PENDING",
      paymentRail: "card",
      clientSecret: intent.clientSecret,
      isMock: intent.isMock,
    };
  }

  public async createWithdrawal(input: WithdrawalInput): Promise<PaymentResult> {
    const payoutId = `po_${Date.now()}`;
    return {
      paymentId: `pay_stripe_${payoutId}`,
      provider: "stripe",
      providerPaymentId: payoutId,
      amount: input.amount,
      currency: input.currency || "USD",
      status: "COMPLETED",
      paymentRail: "transfer",
      isMock: stripeService.isMockMode(),
    };
  }

  public async createTransfer(input: TransferInput): Promise<PaymentResult> {
    const transfer = await stripeService.createTransfer({
      amount: input.amount,
      currency: input.currency || "USD",
      destinationAccountId: input.destinationAccountId,
      payoutId: `payout_${Date.now()}`,
      potId: input.potId,
    });

    return {
      paymentId: `pay_stripe_${transfer.transferId}`,
      provider: "stripe",
      providerPaymentId: transfer.transferId,
      amount: transfer.amount,
      currency: transfer.currency,
      status: "COMPLETED",
      paymentRail: "transfer",
      isMock: transfer.isMock,
    };
  }

  public async getTransaction(transactionId: string): Promise<TransactionResult> {
    return {
      id: transactionId,
      provider: "stripe",
      amount: 2500,
      currency: "USD",
      direction: "CREDIT",
      status: "COMPLETED",
      type: "card_charge",
      occurredAt: new Date(),
    };
  }

  public async listTransactions(accountId: string, limit = 20): Promise<TransactionResult[]> {
    return [];
  }

  public async handleWebhook(rawBody: Buffer | string, signature?: string): Promise<WebhookResult> {
    const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
    const result = await processStripeWebhook(rawBuffer, signature || "");

    return {
      received: result.received,
      provider: "stripe",
      eventId: result.eventId,
      eventType: result.eventType,
      status: result.status,
      message: result.error,
    };
  }

}

export const stripeProvider = new StripeProvider();
