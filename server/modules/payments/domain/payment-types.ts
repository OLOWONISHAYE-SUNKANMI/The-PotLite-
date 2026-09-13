import { StandardPaymentStatus, ProviderType, PaymentRail } from "./payment-status";

export interface CreateCustomerInput {
  userId: number;
  email: string;
  fullName: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  dateOfBirth?: string; // YYYY-MM-DD
  ssn?: string; // or last4 for sandbox
}

export interface CustomerResult {
  customerId: string;
  provider: ProviderType;
  status: string;
  isMock?: boolean;
}

export interface CreateAccountInput {
  userId: number;
  potId?: number;
  customerId: string;
  productType?: "checking" | "savings";
  idempotencyKey?: string;
}

export interface AccountResult {
  accountId: string;
  provider: ProviderType;
  accountType: string;
  depositProduct?: string;
  routingNumber?: string;
  accountNumberMasked?: string;
  status: string;
  balance: number; // in cents
  availableBalance: number; // in cents
  currency: string;
  isMock?: boolean;
}

export interface FundingInput {
  userId: number;
  potId: number;
  amount: number; // in cents
  currency?: string;
  description?: string;
  paymentRail: PaymentRail; // "ach" | "card"
  sourceToken?: string; // Plaid processor token or card token
  counterpartyId?: string; // Verified Unit counterparty
  idempotencyKey?: string;
}

export interface WithdrawalInput {
  userId: number;
  potId: number;
  amount: number; // in cents
  currency?: string;
  destinationAccountId?: string; // Unit counterparty ID or external bank
  routingNumber?: string;
  accountNumber?: string;
  description?: string;
  idempotencyKey?: string;
}

export interface TransferInput {
  sourceAccountId: string; // Unit personal deposit account
  destinationAccountId: string; // Unit group/FBO account
  amount: number; // in cents
  currency?: string;
  description?: string;
  userId: number;
  potId: number;
  idempotencyKey?: string;
}

export interface PaymentResult {
  paymentId: string;
  provider: ProviderType;
  providerPaymentId: string;
  amount: number; // in cents
  currency: string;
  status: StandardPaymentStatus;
  paymentRail: PaymentRail;
  clientSecret?: string; // for Stripe Card Elements
  checkoutUrl?: string; // for Stripe Checkout
  isMock?: boolean;
  metadata?: Record<string, any>;
}

export interface BalanceResult {
  accountId: string;
  provider: ProviderType;
  balance: number; // in cents
  availableBalance: number; // in cents
  hold: number;
  currency: string;
}

export interface TransactionResult {
  id: string;
  provider: ProviderType;
  accountId?: string;
  amount: number; // in cents
  currency: string;
  direction: "CREDIT" | "DEBIT";
  status: StandardPaymentStatus;
  type: string;
  description?: string;
  occurredAt: Date;
  raw?: any;
}

export interface WebhookResult {
  received: boolean;
  provider: ProviderType;
  eventId?: string;
  eventType?: string;
  status: string;
  message?: string;
  handledEntityId?: string;
}
