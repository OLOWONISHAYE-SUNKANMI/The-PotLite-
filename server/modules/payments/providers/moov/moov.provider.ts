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
import { moovClient, MoovClient } from "./moov.client";
import { moovAccounts, MoovAccounts } from "./moov.accounts";
import { moovTransfers, MoovTransfers } from "./moov.transfers";
import { moovWebhooks, MoovWebhooks } from "./moov.webhooks";
import { moovSimulations, MoovSimulations } from "./moov.simulations";

export class MoovProvider implements PaymentProvider {
  public readonly provider: ProviderType = "moov";

  constructor(
    private client: MoovClient = moovClient,
    private accounts: MoovAccounts = moovAccounts,
    private transfers: MoovTransfers = moovTransfers,
    private webhooks: MoovWebhooks = moovWebhooks,
    public simulations: MoovSimulations = moovSimulations
  ) {}

  public isReady(): boolean {
    return true;
  }

  public isMockMode(): boolean {
    return this.client.isMockMode();
  }

  // Identity & Customer Provisioning
  public async createCustomer(input: CreateCustomerInput): Promise<CustomerResult> {
    return this.accounts.createIndividualCustomer(input);
  }

  // Account / Wallet Provisioning
  public async createAccount(input: CreateAccountInput): Promise<AccountResult> {
    return this.accounts.createPotWallet(input);
  }

  public async getAccount(accountId: string): Promise<AccountResult> {
    return this.accounts.getAccount(accountId);
  }

  public async getBalance(accountId: string): Promise<BalanceResult> {
    return this.accounts.getBalance(accountId);
  }

  // Money Movement
  public async createFunding(input: FundingInput): Promise<PaymentResult> {
    const destinationWalletId = input.sourceToken || "wallet_moov_operational_01";
    return this.transfers.createAchDebitFunding(input, destinationWalletId);
  }

  public async createWithdrawal(input: WithdrawalInput): Promise<PaymentResult> {
    const sourceWalletId = "wallet_moov_operational_01";
    return this.transfers.createAchCreditWithdrawal(input, sourceWalletId);
  }

  public async createTransfer(input: TransferInput): Promise<PaymentResult> {
    return this.transfers.createWalletTransfer(input);
  }

  // Transactions & History
  public async getTransaction(transactionId: string): Promise<TransactionResult> {
    return this.transfers.getTransaction(transactionId);
  }

  public async listTransactions(accountId: string, limit = 20): Promise<TransactionResult[]> {
    return this.transfers.listTransactions(accountId, limit);
  }

  // Webhooks
  public async handleWebhook(
    rawBody: Buffer | string,
    signature?: string,
    headers?: Record<string, string | string[] | undefined>
  ): Promise<WebhookResult> {
    return this.webhooks.handleWebhook(rawBody, headers || { "x-signature": signature });
  }
}

export const moovProvider = new MoovProvider();
