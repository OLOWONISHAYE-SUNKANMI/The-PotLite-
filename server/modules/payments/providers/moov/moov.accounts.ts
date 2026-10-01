import { MoovClient, moovClient } from "./moov.client";
import { CreateCustomerInput, CustomerResult, CreateAccountInput, AccountResult, BalanceResult } from "../../domain/payment-types";

// In-memory mock store for sandbox testing when live credentials are not yet supplied
const mockMoovAccounts = new Map<string, any>();
const mockMoovWallets = new Map<string, any>();

// Seed default operational pot wallet
mockMoovWallets.set("wallet_moov_operational_01", {
  walletID: "wallet_moov_operational_01",
  accountID: "acc_moov_facilitator_01",
  name: "The Pot Operational Moov Wallet",
  status: "active",
  balance: 500000, // $5,000.00 in cents
  availableBalance: 500000,
  currency: "USD",
});

export class MoovAccounts {
  constructor(private client: MoovClient = moovClient) {}

  /**
   * Create an Individual Customer Account on Moov with transfer and wallet capabilities
   */
  public async createIndividualCustomer(input: CreateCustomerInput): Promise<CustomerResult> {
    if (this.client.isMockMode()) {
      return this.mockCreateCustomer(input);
    }

    try {
      const sdk = this.client.getSdk();
      const names = input.fullName.trim().split(" ");
      const firstName = names[0] || "User";
      const lastName = names.slice(1).join(" ") || "PotMember";

      const res = await sdk.accounts.create({
        accountType: "individual",
        profile: {
          individual: {
            name: {
              firstName,
              lastName,
            },
            email: input.email,
            phone: input.phone ? { number: input.phone } : undefined,
          },
        },
        capabilities: ["transfers", "wallet.balance"],
        metadata: {
          userId: String(input.userId),
          platform: "ThePot",
        },
      });

      const accountID = res.result.accountID;

      return {
        customerId: accountID,
        provider: "moov",
        status: "verified",
        isMock: false,
      };
    } catch (err: any) {
      console.warn("[MoovAccounts] Live account creation failed, using sandbox fallback:", err.message);
      return this.mockCreateCustomer(input);
    }
  }

  /**
   * Create or link a Moov Wallet for a Pot
   */
  public async createPotWallet(input: CreateAccountInput): Promise<AccountResult> {
    if (this.client.isMockMode()) {
      return this.mockCreateWallet(input);
    }

    try {
      const sdk = this.client.getSdk();
      const accountID = input.customerId || this.client.getFacilitatorAccountId();

      // Check if account already has a default wallet
      const walletsRes = await sdk.wallets.list({ accountID });
      const walletsList = walletsRes.result;
      let wallet = walletsList && walletsList.length > 0 ? walletsList[0] : null;

      if (!wallet) {
        // Create general wallet for this pot
        const newWalletRes = await sdk.wallets.create({
          accountID,
          createWallet: {
            name: `Pot #${input.potId || input.userId} Wallet`,
            description: `Digital wallet for Pot ID ${input.potId}`,
          },
        });
        wallet = newWalletRes.result;
      }

      const balance = wallet.availableBalance?.value ? Math.round(Number(wallet.availableBalance.value)) : 0;

      return {
        accountId: wallet.walletID,
        provider: "moov",
        accountType: "wallet",
        depositProduct: "moov_wallet",
        routingNumber: "MOOV_WALLET",
        accountNumberMasked: `****${wallet.walletID.slice(-4)}`,
        status: wallet.status || "active",
        balance,
        availableBalance: balance,
        currency: "USD",
        isMock: false,
      };
    } catch (err: any) {
      console.warn("[MoovAccounts] Live wallet creation failed, using sandbox fallback:", err.message);
      return this.mockCreateWallet(input);
    }
  }

  /**
   * Get account details by accountId or walletId
   */
  public async getAccount(accountId: string): Promise<AccountResult> {
    if (this.client.isMockMode() || mockMoovWallets.has(accountId)) {
      const wallet = mockMoovWallets.get(accountId) || this.getMockWallet(accountId);
      return {
        accountId: wallet.walletID,
        provider: "moov",
        accountType: "wallet",
        depositProduct: "moov_wallet",
        routingNumber: "MOOV_WALLET",
        accountNumberMasked: `****${wallet.walletID.slice(-4)}`,
        status: wallet.status,
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        currency: wallet.currency,
        isMock: true,
      };
    }

    try {
      const sdk = this.client.getSdk();
      const walletRes = await sdk.wallets.get({
        accountID: this.client.getFacilitatorAccountId(),
        walletID: accountId,
      });
      const wallet = walletRes.result;

      const balanceCents = wallet.availableBalance?.value ? Math.round(Number(wallet.availableBalance.value)) : 0;

      return {
        accountId: wallet.walletID,
        provider: "moov",
        accountType: "wallet",
        depositProduct: "moov_wallet",
        routingNumber: "MOOV_WALLET",
        accountNumberMasked: `****${wallet.walletID.slice(-4)}`,
        status: wallet.status || "active",
        balance: balanceCents,
        availableBalance: balanceCents,
        currency: "USD",
        isMock: false,
      };
    } catch (err: any) {
      console.warn(`[MoovAccounts] Failed to fetch live wallet ${accountId}, using fallback:`, err.message);
      const wallet = this.getMockWallet(accountId);
      return {
        accountId: wallet.walletID,
        provider: "moov",
        accountType: "wallet",
        depositProduct: "moov_wallet",
        routingNumber: "MOOV_WALLET",
        accountNumberMasked: `****${wallet.walletID.slice(-4)}`,
        status: "active",
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        currency: "USD",
        isMock: true,
      };
    }
  }


  /**
   * Get wallet balance
   */
  public async getBalance(accountId: string): Promise<BalanceResult> {
    const acc = await this.getAccount(accountId);
    return {
      accountId: acc.accountId,
      provider: "moov",
      balance: acc.balance,
      availableBalance: acc.availableBalance,
      hold: 0,
      currency: acc.currency,
    };
  }

  // --- Sandbox Simulation Fallbacks ---

  private mockCreateCustomer(input: CreateCustomerInput): CustomerResult {
    const customerId = `moov_cust_${input.userId}_${Date.now()}`;
    const record = {
      customerId,
      email: input.email,
      fullName: input.fullName,
      status: "verified",
      createdAt: new Date(),
    };
    mockMoovAccounts.set(customerId, record);

    return {
      customerId,
      provider: "moov",
      status: "verified",
      isMock: true,
    };
  }

  private mockCreateWallet(input: CreateAccountInput): AccountResult {
    const walletId = `wallet_moov_pot_${input.potId || input.userId}_${Date.now()}`;
    const record = {
      walletID: walletId,
      accountID: input.customerId || "moov_acc_sandbox",
      name: `Pot #${input.potId} Moov Wallet`,
      status: "active",
      balance: 25000, // Seed with $250.00
      availableBalance: 25000,
      currency: "USD",
    };
    mockMoovWallets.set(walletId, record);

    return {
      accountId: walletId,
      provider: "moov",
      accountType: "wallet",
      depositProduct: "moov_wallet",
      routingNumber: "MOOV_WALLET",
      accountNumberMasked: `****${walletId.slice(-4)}`,
      status: "active",
      balance: 25000,
      availableBalance: 25000,
      currency: "USD",
      isMock: true,
    };
  }

  private getMockWallet(walletId: string) {
    if (mockMoovWallets.has(walletId)) {
      return mockMoovWallets.get(walletId);
    }
    const fallback = {
      walletID: walletId,
      name: `Moov Wallet ${walletId}`,
      status: "active",
      balance: 50000,
      availableBalance: 50000,
      currency: "USD",
    };
    mockMoovWallets.set(walletId, fallback);
    return fallback;
  }
}

export const moovAccounts = new MoovAccounts();
