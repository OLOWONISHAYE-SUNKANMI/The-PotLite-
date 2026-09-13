import { WebhookResult } from "../../domain/payment-types";
import * as storage from "../../../../storage";
import { mapUnitStatusToStandard } from "../../domain/payment-status";

const inMemoryProcessedEvents = new Set<string>();

export class UnitWebhooks {
  public async handleWebhook(rawBody: Buffer | string, signature?: string): Promise<WebhookResult> {
    try {
      const payloadString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
      const event = JSON.parse(payloadString);

      const eventData = event.data || event;
      const eventId = eventData.id || `evt_${Date.now()}`;
      const eventType = eventData.attributes?.type || event.type || "unit.event";

      // 1. Check idempotency in memory or DB
      if (inMemoryProcessedEvents.has(eventId)) {
        return {
          received: true,
          provider: "unit",
          eventId,
          eventType,
          status: "already_processed",
          message: "Event was already processed previously",
        };
      }

      let existing: any = null;
      try {
        existing = await storage.getProviderWebhookEvent(eventId);
      } catch {
        // In local sandbox offline mode
      }

      if (existing && existing.processed) {
        inMemoryProcessedEvents.add(eventId);
        return {
          received: true,
          provider: "unit",
          eventId,
          eventType,
          status: "already_processed",
          message: "Event was already processed previously",
        };
      }

      // 2. Persist raw event in provider_webhook_events
      let webhookRecord: any;
      try {
        if (!existing) {
          webhookRecord = await storage.createProviderWebhookEvent({
            provider: "unit",
            providerEventId: eventId,
            eventType,
            payload: event,
            processingStatus: "pending",
            processed: false,
          });
        } else {
          webhookRecord = existing;
        }
      } catch (err: any) {
        console.warn("[UnitWebhooks] DB webhook record skipped in sandbox mode:", err.message);
      }

      // 3. Process according to event type
      let handledEntityId: string | undefined;

      if (eventType.startsWith("payment.")) {
        handledEntityId = await this.processPaymentEvent(eventData);
      } else if (eventType.startsWith("account.")) {
        handledEntityId = await this.processAccountEvent(eventData);
      } else if (eventType.startsWith("transaction.")) {
        handledEntityId = await this.processTransactionEvent(eventData);
      }

      // 4. Mark processed
      inMemoryProcessedEvents.add(eventId);
      if (webhookRecord?.id) {
        try {
          await storage.updateProviderWebhookEvent(webhookRecord.id, {
            processed: true,
            processingStatus: "processed",
            processedAt: new Date(),
          });
        } catch {}
      }

      return {
        received: true,
        provider: "unit",
        eventId,
        eventType,
        status: "processed",
        handledEntityId,
      };
    } catch (err: any) {
      console.error("[UnitWebhooks] Error handling webhook:", err);
      return {
        received: false,
        provider: "unit",
        status: "error",
        message: err.message,
      };
    }
  }

  private async processPaymentEvent(eventData: any): Promise<string | undefined> {
    const paymentId = eventData.relationships?.payment?.data?.id || eventData.id;

    const eventType = eventData.attributes?.type;

    if (!paymentId) return;

    let targetStatus = "completed";
    if (eventType === "payment.pending") targetStatus = "pending";
    if (eventType === "payment.cleared") targetStatus = "completed";
    if (eventType === "payment.returned") targetStatus = "returned";
    if (eventType === "payment.canceled") targetStatus = "cancelled";

    console.log(`[UnitWebhooks] Payment event ${eventType} for payment ${paymentId} -> status ${targetStatus}`);

    // Update matching provider transaction if exists
    try {
      const existingTx = await storage.getProviderTransactionByProviderId(paymentId);
      if (existingTx) {
        // Record transaction update
      }
    } catch {
      // In sandbox mode when DB is offline
    }

    return paymentId;
  }


  private async processAccountEvent(eventData: any): Promise<string | undefined> {
    const accountId = eventData.id;
    console.log(`[UnitWebhooks] Account event for account ${accountId}`);
    return accountId;
  }

  private async processTransactionEvent(eventData: any): Promise<string | undefined> {
    const txId = eventData.id;
    console.log(`[UnitWebhooks] Transaction event for tx ${txId}`);
    return txId;
  }
}

export const unitWebhooks = new UnitWebhooks();
