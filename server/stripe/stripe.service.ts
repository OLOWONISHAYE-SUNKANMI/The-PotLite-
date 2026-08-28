import Stripe from "stripe";
import {
  formatStripeAmount,
  validateCurrency,
  generatePaymentIdempotencyKey,
  generatePayoutIdempotencyKey,
  mapStripeError,
} from "./stripe.utils";

export interface CreatePaymentIntentParams {
  amount: number; // In cents/smallest unit
  currency?: string;
  potId: string | number;
  userId: string | number;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  amount: number; // In cents/smallest unit
  currency?: string;
  potId: string | number;
  userId: string | number;
  potName: string;
  userEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CreateRefundParams {
  paymentIntentId: string;
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?: Record<string, string>;
}

export interface CreateTransferParams {
  amount: number;
  currency?: string;
  destinationAccountId: string;
  payoutId: string | number;
  potId: string | number;
  metadata?: Record<string, string>;
}

export interface StripePaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  isMock?: boolean;
}

export interface StripeCheckoutSessionResult {
  sessionId: string;
  url: string;
  amount: number;
  currency: string;
  status: string;
  isMock?: boolean;
}

export class StripeService {
  private stripe: Stripe | null = null;
  private readonly secretKey: string;
  private readonly publishableKey: string;
  private readonly webhookSecret: string;
  private readonly appUrl: string;
  private readonly isMock: boolean;

  constructor() {
    if (typeof process.loadEnvFile === "function") {
      try {
        process.loadEnvFile();
      } catch {}
    }

    this.secretKey = process.env.STRIPE_SECRET_KEY || "";
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    this.appUrl = process.env.APP_URL || "http://localhost:3000";

    // Determine if keys are real or placeholders
    this.isMock = !this.secretKey || this.secretKey.startsWith("sk_test_51Mock") || this.secretKey.includes("placeholder");

    if (!this.isMock && this.secretKey) {
      try {
        const apiVersion = (process.env.STRIPE_API_VERSION || "2024-12-18.acacia") as any;
        this.stripe = new Stripe(this.secretKey, {
          apiVersion,
          typescript: true,
        });
        console.log("[Stripe] Initialized live Stripe SDK client");
      } catch (err: any) {
        console.warn("[Stripe] Failed to initialize Stripe client, running in sandbox mode:", err.message);
        this.isMock = true;
      }
    } else {
      console.log("[Stripe] Running in simulated sandbox mode with test keys");
    }
  }

  getPublishableKey(): string {
    return this.publishableKey || "pk_test_placeholder_key";
  }

  isMockMode(): boolean {
    return this.isMock;
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<StripePaymentIntentResult> {
    const amount = formatStripeAmount(params.amount);
    const currency = validateCurrency(params.currency || "USD");
    const idempotencyKey = generatePaymentIdempotencyKey(params.potId, params.userId);

    const metadata: Record<string, string> = {
      userId: String(params.userId),
      potId: String(params.potId),
      ...(params.metadata || {}),
    };

    if (this.isMock || !this.stripe) {
      const mockId = `pi_mock_${Math.random().toString(36).substring(2, 12)}`;
      const mockSecret = `${mockId}_secret_${Math.random().toString(36).substring(2, 10)}`;
      return {
        paymentIntentId: mockId,
        clientSecret: mockSecret,
        amount,
        currency: currency.toUpperCase(),
        status: "requires_payment_method",
        isMock: true,
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount,
          currency,
          metadata,
          description: params.description || `Deposit to Pot #${params.potId}`,
          automatic_payment_methods: { enabled: true },
        },
        {
          idempotencyKey,
        },
      );

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || "",
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
      };
    } catch (error) {
      const mapped = mapStripeError(error);
      throw new Error(`Stripe PaymentIntent error: [${mapped.code}] ${mapped.message}`);
    }
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<StripeCheckoutSessionResult> {
    const amount = formatStripeAmount(params.amount);
    const currency = validateCurrency(params.currency || "USD");
    const idempotencyKey = generatePaymentIdempotencyKey(params.potId, params.userId);

    const successUrl = params.successUrl || `${this.appUrl}/?payment=success&pot_id=${params.potId}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = params.cancelUrl || `${this.appUrl}/?payment=cancelled&pot_id=${params.potId}`;

    const metadata: Record<string, string> = {
      userId: String(params.userId),
      potId: String(params.potId),
      ...(params.metadata || {}),
    };

    if (this.isMock || !this.stripe) {
      const mockSessionId = `cs_test_mock_${Math.random().toString(36).substring(2, 14)}`;
      return {
        sessionId: mockSessionId,
        url: `${this.appUrl}/?payment=success&pot_id=${params.potId}&session_id=${mockSessionId}&mock=true`,
        amount,
        currency: currency.toUpperCase(),
        status: "open",
        isMock: true,
      };
    }

    try {
      const session = await this.stripe.checkout.sessions.create(
        {
          payment_method_types: ["card"],
          mode: "payment",
          customer_email: params.userEmail,
          line_items: [
            {
              price_data: {
                currency,
                product_data: {
                  name: `Contribution: ${params.potName}`,
                  description: `Deposit to savings pool`,
                },
                unit_amount: amount,
              },
              quantity: 1,
            },
          ],
          metadata,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
        {
          idempotencyKey,
        },
      );

      return {
        sessionId: session.id,
        url: session.url || "",
        amount,
        currency: currency.toUpperCase(),
        status: session.status || "open",
      };
    } catch (error) {
      const mapped = mapStripeError(error);
      throw new Error(`Stripe Checkout Session error: [${mapped.code}] ${mapped.message}`);
    }
  }

  async createRefund(params: CreateRefundParams): Promise<any> {
    if (this.isMock || !this.stripe) {
      return {
        id: `re_mock_${Math.random().toString(36).substring(2, 10)}`,
        status: "succeeded",
        amount: params.amount,
        payment_intent: params.paymentIntentId,
        isMock: true,
      };
    }

    try {
      return await this.stripe.refunds.create({
        payment_intent: params.paymentIntentId,
        amount: params.amount ? formatStripeAmount(params.amount) : undefined,
        reason: params.reason,
        metadata: params.metadata,
      });
    } catch (error) {
      const mapped = mapStripeError(error);
      throw new Error(`Stripe Refund error: [${mapped.code}] ${mapped.message}`);
    }
  }

  async createTransfer(params: CreateTransferParams): Promise<any> {
    const amount = formatStripeAmount(params.amount);
    const currency = validateCurrency(params.currency || "USD");
    const idempotencyKey = generatePayoutIdempotencyKey(params.payoutId, params.destinationAccountId);

    if (this.isMock || !this.stripe) {
      return {
        id: `tr_mock_${Math.random().toString(36).substring(2, 10)}`,
        amount,
        currency,
        destination: params.destinationAccountId,
        isMock: true,
      };
    }

    try {
      return await this.stripe.transfers.create(
        {
          amount,
          currency,
          destination: params.destinationAccountId,
          metadata: {
            payoutId: String(params.payoutId),
            potId: String(params.potId),
            ...(params.metadata || {}),
          },
        },
        {
          idempotencyKey,
        },
      );
    } catch (error) {
      const mapped = mapStripeError(error);
      throw new Error(`Stripe Transfer error: [${mapped.code}] ${mapped.message}`);
    }
  }

  constructEvent(rawBody: Buffer, signature: string, secret?: string): Stripe.Event {
    const webhookSecret = secret || this.webhookSecret;
    if (this.isMock || !this.stripe) {
      try {
        return JSON.parse(rawBody.toString("utf-8"));
      } catch {
        return { id: "evt_mock", type: "payment_intent.succeeded", data: { object: {} } } as any;
      }
    }

    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error: any) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
}

export const stripeService = new StripeService();
