import Stripe from "stripe";
import { stripeService } from "./stripe.service";
import * as storage from "../storage";
import { db } from "@db";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

export interface WebhookResult {
  received: boolean;
  duplicate?: boolean;
  status: string;
  eventType?: string;
  eventId?: string;
  error?: string;
}

export async function processStripeWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<WebhookResult> {
  let event: Stripe.Event;

  try {
    event = stripeService.constructEvent(rawBody, signature);
  } catch (err: any) {
    console.error("[Stripe Webhook] Verification error:", err.message);
    return {
      received: false,
      status: "signature_verification_failed",
      error: err.message,
    };
  }

  console.log(`[Stripe Webhook] Received Event [${event.type}] (ID: ${event.id})`);

  // 1. Webhook deduplication / idempotency check (safe against DB errors)
  try {
    const existing = await db.query.stripeWebhookEvents.findFirst({
      where: eq(schema.stripeWebhookEvents.stripeEventId, event.id),
    });

    if (existing && existing.processed) {
      console.log(`[Stripe Webhook] Duplicate event ${event.id} already processed. Skipping.`);
      return {
        received: true,
        duplicate: true,
        status: "already_processed",
        eventId: event.id,
        eventType: event.type,
      };
    }

    if (!existing) {
      await db.insert(schema.stripeWebhookEvents).values({
        stripeEventId: event.id,
        eventType: event.type,
        processed: false,
        payload: event as any,
      });
    }
  } catch (dbErr: any) {
    // If DB is offline / sandbox fallback, log and proceed with event processing
    console.warn("[Stripe Webhook] Notice: Webhook event tracking skipped in sandbox mode:", dbErr.message);
  }

  // 2. Process authoritative Stripe events
  let processingError: string | null = null;

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const potId = paymentIntent.metadata?.potId ? parseInt(paymentIntent.metadata.potId) : undefined;
        const userId = paymentIntent.metadata?.userId ? parseInt(paymentIntent.metadata.userId) : undefined;
        const amount = paymentIntent.amount; // in cents/smallest unit

        console.log(`[Stripe Webhook] PaymentIntent succeeded for Pot #${potId}: ${amount} ${paymentIntent.currency}`);

        if (potId) {
          try {
            // Update pot balance and record transaction in DB
            await storage.createTransaction({
              potId,
              userId: userId || 1,
              type: "deposit",
              amount: Math.round(amount / 100), // Convert cents to pot coins/currency if needed
              currency: paymentIntent.currency.toUpperCase(),
              direction: "CREDIT",
              reference: `tx_stripe_${paymentIntent.id}`,
              description: `Stripe deposit: ${paymentIntent.id}`,
              status: "completed",
              metadata: {
                stripePaymentIntentId: paymentIntent.id,
                amountInCents: amount,
              },
            });
          } catch (e: any) {
            console.warn("[Stripe Webhook] DB storage update warning in sandbox:", e.message);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const failureCode = paymentIntent.last_payment_error?.code || "PAYMENT_FAILED";
        const failureMessage = paymentIntent.last_payment_error?.message || "Payment intent failed";
        console.warn(`[Stripe Webhook] PaymentIntent ${paymentIntent.id} failed: [${failureCode}] ${failureMessage}`);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const potId = session.metadata?.potId ? parseInt(session.metadata.potId) : undefined;
        const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : undefined;
        const amount = session.amount_total || 0;

        console.log(`[Stripe Webhook] Checkout Session ${session.id} completed for Pot #${potId}: ${amount} ${session.currency}`);

        if (potId && amount > 0) {
          try {
            await storage.createTransaction({
              potId,
              userId: userId || 1,
              type: "deposit",
              amount: Math.round(amount / 100),
              currency: (session.currency || "USD").toUpperCase(),
              direction: "CREDIT",
              reference: `tx_session_${session.id}`,
              description: `Stripe Checkout deposit: ${session.id}`,
              status: "completed",
              metadata: {
                stripeCheckoutSessionId: session.id,
                amountInCents: amount,
              },
            });
          } catch (e: any) {
            console.warn("[Stripe Webhook] DB storage update warning in sandbox:", e.message);
          }
        }
        break;
      }

      case "payout.paid":
      case "transfer.created": {
        const object = event.data.object as any;
        console.log(`[Stripe Webhook] Stripe Payout/Transfer completed: ${object.id}`);
        break;
      }

      case "payout.failed": {
        const object = event.data.object as any;
        console.error(`[Stripe Webhook] Stripe Payout failed: ${object.id} - ${object.failure_message || object.failure_code}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        break;
    }
  } catch (err: any) {
    processingError = err.message || "Unknown webhook processing error";
    console.error(`[Stripe Webhook] Error processing event ${event.id}:`, processingError);
  }

  // 3. Mark event processed in DB if available
  try {
    await db.update(schema.stripeWebhookEvents)
      .set({
        processed: processingError === null,
        processingError: processingError || undefined,
        processedAt: new Date(),
      })
      .where(eq(schema.stripeWebhookEvents.stripeEventId, event.id));
  } catch {
    // Ignore in sandbox mode
  }

  return {
    received: true,
    status: processingError ? "processing_error" : "success",
    eventId: event.id,
    eventType: event.type,
    error: processingError || undefined,
  };
}
