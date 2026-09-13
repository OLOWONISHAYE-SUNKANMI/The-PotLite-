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
} from "./payment-types";
import { ProviderType } from "./payment-status";

export interface PaymentProvider {
  readonly provider: ProviderType;

  // Lifecycle & Status
  isReady(): boolean;
  isMockMode(): boolean;

  // Identity & Customer Provisioning
  createCustomer(input: CreateCustomerInput): Promise<CustomerResult>;

  // Account Provisioning
  createAccount(input: CreateAccountInput): Promise<AccountResult>;
  getAccount(accountId: string): Promise<AccountResult>;
  getBalance(accountId: string): Promise<BalanceResult>;

  // Money Movement
  createFunding(input: FundingInput): Promise<PaymentResult>;
  createWithdrawal(input: WithdrawalInput): Promise<PaymentResult>;
  createTransfer(input: TransferInput): Promise<PaymentResult>;

  // Transactions & History
  getTransaction(transactionId: string): Promise<TransactionResult>;
  listTransactions(accountId: string, limit?: number): Promise<TransactionResult[]>;

  // Webhooks
  handleWebhook(rawBody: Buffer | string, signature?: string): Promise<WebhookResult>;
}
