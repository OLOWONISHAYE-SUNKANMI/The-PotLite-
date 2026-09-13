import { UnitClient, unitClient } from "./unit.client";
import { CreateAccountInput, AccountResult, BalanceResult } from "../../domain/payment-types";

// In-memory account store for sandbox fallback
const mockAccounts = new Map<string, any>();

// Seed pre-verified sandbox deposit account from live inspection
mockAccounts.set("22170443", {
  id: "22170443",
  type: "depositAccount",
  attributes: {
    name: "The Pot Operational Account",
    depositProduct: "checking",
    routingNumber: "812345678",
    accountNumber: "1018733994",
    status: "Open",
    balance: 500000, // $5,000.00
    available: 500000,
    hold: 0,
    currency: "USD",
  },
});

export class UnitAccounts {
  constructor(private client: UnitClient = unitClient) {}

  public async createDepositAccount(input: CreateAccountInput): Promise<AccountResult> {
    if (this.client.isMockMode()) {
      return this.mockCreateAccount(input);
    }

    try {
      const payload = {
        data: {
          type: "depositAccount",
          attributes: {
            depositProduct: input.productType || "checking",
            tags: {
              userId: String(input.userId),
              potId: input.potId ? String(input.potId) : undefined,
            },
          },
          relationships: {
            customer: {
              data: {
                type: "customer",
                id: input.customerId,
              },
            },
          },
        },
      };

      const res = await this.client.post("/accounts", payload, input.idempotencyKey);
      const data: any = res.data;
      const attrs = data.attributes;

      return {
        accountId: data.id,
        provider: "unit",
        accountType: "deposit",
        depositProduct: attrs.depositProduct || "checking",
        routingNumber: attrs.routingNumber,
        accountNumberMasked: attrs.accountNumber ? `****${attrs.accountNumber.slice(-4)}` : undefined,
        status: attrs.status || "Open",
        balance: attrs.balance || 0,
        availableBalance: attrs.available || 0,
        currency: attrs.currency || "USD",
        isMock: false,
      };
    } catch (err: any) {
      console.warn("[UnitAccounts] Live account creation failed, using sandbox fallback:", err.message);
      return this.mockCreateAccount(input);
    }
  }

  public async getAccount(accountId: string): Promise<AccountResult> {
    if (this.client.isMockMode() || mockAccounts.has(accountId)) {
      const acc = mockAccounts.get(accountId) || this.getMockAccount(accountId);
      const attrs = acc.attributes;
      return {
        accountId: acc.id,
        provider: "unit",
        accountType: "deposit",
        depositProduct: attrs.depositProduct || "checking",
        routingNumber: attrs.routingNumber,
        accountNumberMasked: attrs.accountNumber ? `****${attrs.accountNumber.slice(-4)}` : "****3994",
        status: attrs.status || "Open",
        balance: attrs.balance || 0,
        availableBalance: attrs.available || 0,
        currency: attrs.currency || "USD",
        isMock: true,
      };
    }

    try {
      const res = await this.client.get(`/accounts/${accountId}`);
      const data: any = res.data;
      const attrs = data.attributes;

      return {
        accountId: data.id,
        provider: "unit",
        accountType: data.type === "walletAccount" ? "wallet" : "deposit",
        depositProduct: attrs.depositProduct,
        routingNumber: attrs.routingNumber,
        accountNumberMasked: attrs.accountNumber ? `****${attrs.accountNumber.slice(-4)}` : undefined,
        status: attrs.status,
        balance: attrs.balance || 0,
        availableBalance: attrs.available || 0,
        currency: attrs.currency || "USD",
        isMock: false,
      };
    } catch (err: any) {
      console.warn(`[UnitAccounts] Failed to fetch live account ${accountId}, falling back to sandbox mock:`, err.message);
      const mockAcc = this.getMockAccount(accountId);
      const attrs = mockAcc.attributes;
      return {
        accountId,
        provider: "unit",
        accountType: "deposit",
        depositProduct: "checking",
        routingNumber: attrs.routingNumber,
        accountNumberMasked: `****${attrs.accountNumber.slice(-4)}`,
        status: attrs.status,
        balance: attrs.balance,
        availableBalance: attrs.available,
        currency: attrs.currency,
        isMock: true,
      };
    }
  }

  public async getBalance(accountId: string): Promise<BalanceResult> {
    const acc = await this.getAccount(accountId);
    return {
      accountId: acc.accountId,
      provider: "unit",
      balance: acc.balance,
      availableBalance: acc.availableBalance,
      hold: acc.balance - acc.availableBalance,
      currency: acc.currency,
    };
  }

  private mockCreateAccount(input: CreateAccountInput): AccountResult {
    const accountId = `acc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const randomAccNum = `1018${Math.floor(100000 + Math.random() * 900000)}`;
    const mockRecord = {
      id: accountId,
      type: "depositAccount",
      attributes: {
        depositProduct: input.productType || "checking",
        routingNumber: "812345678",
        accountNumber: randomAccNum,
        status: "Open",
        balance: 0,
        available: 0,
        hold: 0,
        currency: "USD",
      },
    };
    mockAccounts.set(accountId, mockRecord);

    return {
      accountId,
      provider: "unit",
      accountType: "deposit",
      depositProduct: input.productType || "checking",
      routingNumber: "812345678",
      accountNumberMasked: `****${randomAccNum.slice(-4)}`,
      status: "Open",
      balance: 0,
      availableBalance: 0,
      currency: "USD",
      isMock: true,
    };
  }

  private getMockAccount(accountId: string) {
    if (mockAccounts.has(accountId)) {
      return mockAccounts.get(accountId);
    }
    const acc = {
      id: accountId,
      type: "depositAccount",
      attributes: {
        depositProduct: "checking",
        routingNumber: "812345678",
        accountNumber: "1018733994",
        status: "Open",
        balance: 25000, // $250.00
        available: 25000,
        currency: "USD",
      },
    };
    mockAccounts.set(accountId, acc);
    return acc;
  }
}

export const unitAccounts = new UnitAccounts();
