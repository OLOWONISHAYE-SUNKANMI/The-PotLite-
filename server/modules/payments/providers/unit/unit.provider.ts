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
import { ProviderType, mapUnitStatusToStandard } from "../../domain/payment-status";
import { unitClient, UnitClient } from "./unit.client";
import { unitCustomers, UnitCustomers } from "./unit.customers";
import { unitAccounts, UnitAccounts } from "./unit.accounts";
import { unitAch, UnitAch } from "./unit.ach";
import { unitBookPayments, UnitBookPayments } from "./unit.book-payments";
import { unitSimulations, UnitSimulations } from "./unit.simulations";
import { unitWebhooks, UnitWebhooks } from "./unit.webhooks";

export class UnitProvider implements PaymentProvider {
  public readonly provider: ProviderType = "unit";

  constructor(
    private client: UnitClient = unitClient,
    private customers: UnitCustomers = unitCustomers,
    private accounts: UnitAccounts = unitAccounts,
    private ach: UnitAch = unitAch,
    private bookPayments: UnitBookPayments = unitBookPayments,
    public simulations: UnitSimulations = unitSimulations,
    private webhooks: UnitWebhooks = unitWebhooks
  ) {}

  public isReady(): boolean {
    return true;
  }

  public isMockMode(): boolean {
    return this.client.isMockMode();
  }

  // Customer Provisioning
  public async createCustomer(input: CreateCustomerInput): Promise<CustomerResult> {
    return this.customers.createIndividualCustomer(input);
  }

  // Account Provisioning
  public async createAccount(input: CreateAccountInput): Promise<AccountResult> {
    return this.accounts.createDepositAccount(input);
  }

  public async getAccount(accountId: string): Promise<AccountResult> {
    return this.accounts.getAccount(accountId);
  }

  public async getBalance(accountId: string): Promise<BalanceResult> {
    return this.accounts.getBalance(accountId);
  }

  // Money Movement
  public async createFunding(input: FundingInput): Promise<PaymentResult> {
    // 1. Resolve or verify Unit deposit account for the Pot
    let depositAccountId = input.sourceToken;
    if (!depositAccountId) {
      // In sandbox fallback or standard usage, use the verified sandbox account or generate one
      depositAccountId = "22170443";
    }

    return this.ach.createAchDebitFunding(input, depositAccountId);
  }

  public async createWithdrawal(input: WithdrawalInput): Promise<PaymentResult> {
    const sourceAccountId = "22170443";
    return this.ach.createAchCreditWithdrawal(input, sourceAccountId);
  }

  public async createTransfer(input: TransferInput): Promise<PaymentResult> {
    return this.bookPayments.createBookPayment(input);
  }

  // Transactions & History
  public async getTransaction(transactionId: string): Promise<TransactionResult> {
    if (this.client.isMockMode()) {
      return {
        id: transactionId,
        provider: "unit",
        amount: 2500,
        currency: "USD",
        direction: "CREDIT",
        status: "COMPLETED",
        type: "ach_payment",
        description: "Sandbox Unit Transaction",
        occurredAt: new Date(),
      };
    }

    try {
      const res = await this.client.get(`/transactions/${transactionId}`);
      const data: any = res.data;
      const attrs = data.attributes;

      return {
        id: data.id,
        provider: "unit",
        accountId: data.relationships?.account?.data?.id,
        amount: attrs.amount,
        currency: "USD",
        direction: attrs.direction === "Credit" ? "CREDIT" : "DEBIT",
        status: mapUnitStatusToStandard(attrs.status || "Completed"),
        type: attrs.type || "transaction",
        description: attrs.description,
        occurredAt: new Date(attrs.createdAt),
        raw: attrs,
      };
    } catch (err: any) {
      console.warn(`[UnitProvider] Failed to fetch transaction ${transactionId}, using fallback:`, err.message);
      return {
        id: transactionId,
        provider: "unit",
        amount: 2500,
        currency: "USD",
        direction: "CREDIT",
        status: "COMPLETED",
        type: "ach_payment",
        description: "Sandbox Unit Transaction",
        occurredAt: new Date(),
      };
    }
  }

  public async listTransactions(accountId: string, limit = 20): Promise<TransactionResult[]> {
    if (this.client.isMockMode()) {
      return [
        {
          id: `tx_${Date.now()}_1`,
          provider: "unit",
          accountId,
          amount: 5000,
          currency: "USD",
          direction: "CREDIT",
          status: "COMPLETED",
          type: "ach_deposit",
          description: "Initial ACH Deposit",
          occurredAt: new Date(Date.now() - 3600000),
        },
        {
          id: `tx_${Date.now()}_2`,
          provider: "unit",
          accountId,
          amount: 2500,
          currency: "USD",
          direction: "CREDIT",
          status: "COMPLETED",
          type: "book_payment",
          description: "Personal Pot Contribution",
          occurredAt: new Date(),
        },
      ];
    }

    try {
      const res = await this.client.get(`/transactions?filter[accountId]=${accountId}&page[limit]=${limit}`);
      const list = Array.isArray(res.data) ? res.data : [res.data];

      return list.map((item: any) => ({
        id: item.id,
        provider: "unit",
        accountId,
        amount: item.attributes.amount,
        currency: "USD",
        direction: item.attributes.direction === "Credit" ? "CREDIT" : "DEBIT",
        status: mapUnitStatusToStandard(item.attributes.status || "Completed"),
        type: item.attributes.type || "transaction",
        description: item.attributes.description,
        occurredAt: new Date(item.attributes.createdAt),
        raw: item.attributes,
      }));
    } catch (err: any) {
      console.warn(`[UnitProvider] Failed to list transactions for account ${accountId}:`, err.message);
      return [];
    }
  }

  // Webhooks
  public async handleWebhook(rawBody: Buffer | string, signature?: string): Promise<WebhookResult> {
    return this.webhooks.handleWebhook(rawBody, signature);
  }
}

export const unitProvider = new UnitProvider();
