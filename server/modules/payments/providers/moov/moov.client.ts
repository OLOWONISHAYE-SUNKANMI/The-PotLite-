import { Moov } from "@moovio/sdk";

export class MoovClient {
  private sdk: Moov | null = null;
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly accountId: string;
  private readonly isMock: boolean;

  constructor() {
    if (typeof process.loadEnvFile === "function") {
      try {
        process.loadEnvFile();
      } catch {}
    }

    this.publicKey = process.env.MOOV_PUBLIC_KEY || "";
    this.secretKey = process.env.MOOV_SECRET_KEY || "";
    this.accountId = process.env.MOOV_ACCOUNT_ID || "moov_sandbox_facilitator_01";

    // Auto-enable mock mode if keys are missing or explicit mock flag is set
    this.isMock = !this.publicKey || !this.secretKey || process.env.MOOV_MOCK_MODE === "true";

    if (!this.isMock) {
      try {
        this.sdk = new Moov({
          security: {
            username: this.publicKey,
            password: this.secretKey,
          },
        });
        console.log(`[MoovClient] Initialized live Moov SDK with Facilitator Account ${this.accountId}`);
      } catch (err: any) {
        console.warn("[MoovClient] SDK initialization error, falling back to mock mode:", err.message);
        this.sdk = null;
      }
    } else {
      console.log("[MoovClient] Initialized in local sandbox simulation mode (waiting for developer API keys)");
    }
  }

  public isMockMode(): boolean {
    return this.isMock || !this.sdk;
  }

  public getSdk(): Moov {
    if (!this.sdk) {
      throw new Error("Moov SDK is running in sandbox mock mode without API credentials");
    }
    return this.sdk;
  }

  public getFacilitatorAccountId(): string {
    return this.accountId;
  }

  public getPublicKey(): string {
    return this.publicKey;
  }
}

export const moovClient = new MoovClient();
