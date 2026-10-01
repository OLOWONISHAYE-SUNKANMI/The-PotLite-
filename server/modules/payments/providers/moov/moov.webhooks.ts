import crypto from "crypto";
import { WebhookResult } from "../../domain/payment-types";
import { mapMoovStatusToStandard } from "../../domain/payment-status";
import { ledgerService } from "../../services/ledger.service";
import * as storage from "../../../../storage";

const inMemoryProcessedMoovEvents = new Set<string>();

export class MoovWebhooks {
  private readonly webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.MOOV_WEBHOOK_SECRET || "";
  }

  /**
   * Verify Moov Webhook HMAC-SHA512 Signature
   * Signature is constructed from: `${timestamp}|${nonce}|${webhookId}`
   */
  public verifySignature(
    timestamp?: string,
    nonce?: string,
    webhookId?: string,
    signature?: string
  ): boolean {
    if (!this.webhookSecret) {
      // In sandbox mode without configured secret, allow requests through for testing
      return true;
    }

    if (!timestamp || !nonce || !webhookId || !signature) {
      return false;
    }

    try {
      const payloadString = `${timestamp}|${nonce}|${webhookId}`;
      const expectedSignature = crypto
        .createHmac("sha512", this.webhookSecret)
        .update(payloadString)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch (err: any) {
      console.error("[MoovWebhooks] Signature verification error:", err.message);
      return false;
    }
  }

  /**
   * Handle incoming Moov webhook event payload
   */
  public async handleWebhook(
    rawBody: Buffer | string,
    headers: Record<string, string | string[] | undefined> = {}
  ): Promise<WebhookResult> {
    try {
      const timestamp = (headers["x-timestamp"] || headers["X-Timestamp"]) as string;
      const nonce = (headers["x-nonce"] || headers["X-Nonce"]) as string;
      const webhookId = (headers["x-webhook-id"] || headers["X-Webhook-ID"]) as string;
      const signature = (headers["x-signature"] || headers["X-Signature"]) as string;

      // 1. Signature Verification
      const isValid = this.verifySignature(timestamp, nonce, webhookId, signature);
      if (!isValid) {
        console.warn("[MoovWebhooks] Invalid webhook signature detected. Event rejected.");
        return {
          received: false,
          provider: "moov",
          status: "invalid_signature",
          message: "Signature verification failed",
        };
      }

      // 2. Parse Event JSON
      const payloadString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
      const event = JSON.parse(payloadString);

      const eventId = event.eventID || webhookId || `moov_evt_${Date.now()}`;
      const eventType = event.type || event.eventType || "transfer.updated";
      const eventData = event.data || event;

      // 3. Deduplication Check
      if (inMemoryProcessedMoovEvents.has(eventId)) {
        return {
          received: true,
          provider: "moov",
          eventId,
          eventType,
          status: "already_processed",
          message: "Event was already processed",
        };
      }

      let existing: any = null;
      try {
        existing = await storage.getProviderWebhookEvent(eventId);
      } catch {}

      if (existing && existing.processed) {
        inMemoryProcessedMoovEvents.add(eventId);
        return {
          received: true,
          provider: "moov",
          eventId,
          eventType,
          status: "already_processed",
          message: "Event was already processed",
        };
      }

      // 4. Persist in database
      let webhookRecord: any;
      try {
        if (!existing) {
          webhookRecord = await storage.createProviderWebhookEvent({
            provider: "moov",
            providerEventId: eventId,
            eventType,
            payload: event,
            processingStatus: "pending",
            processed: false,
          });
        } else {
          webhookRecord = existing;
        }
      } catch (dbErr: any) {
        console.warn("[MoovWebhooks] DB webhook record skipped in sandbox:", dbErr.message);
      }

      // 5. Process according to event type
      let handledEntityId: string | undefined;

      if (eventType.startsWith("transfer.")) {
        handledEntityId = await this.processTransferEvent(eventType, eventData);
      } else if (eventType.startsWith("account.")) {
        handledEntityId = await this.processAccountEvent(eventType, eventData);
      } else if (eventType.startsWith("wallet.")) {
        handledEntityId = await this.processWalletEvent(eventType, eventData);
      }

      // 6. Mark processed
      inMemoryProcessedMoovEvents.add(eventId);
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
        provider: "moov",
        eventId,
        eventType,
        status: "processed",
        handledEntityId,
      };
    } catch (err: any) {
      console.error("[MoovWebhooks] Webhook processing exception:", err);
      return {
        received: false,
        provider: "moov",
        status: "error",
        message: err.message,
      };
    }
  }

  /**
   * Process Moov Transfer Events (e.g. transfer.created, transfer.updated)
   */
  private async processTransferEvent(eventType: string, data: any): Promise<string> {
    const transferId = data.transferID || data.id;
    const moovStatus = data.status;
    const standardStatus = mapMoovStatusToStandard(moovStatus);
    const amountVal = data.amount?.value ? Math.round(Number(data.amount.value)) : 0;
    const potId = data.metadata?.potId ? parseInt(data.metadata.potId) : undefined;
    const userId = data.metadata?.userId ? parseInt(data.metadata.userId) : 1;

    console.log(`[MoovWebhooks] Handling ${eventType} for Transfer ${transferId}: Status=${moovStatus} -> ${standardStatus}`);

    // If transfer completed, ensure pot balance and ledger reflect the deposit
    if (standardStatus === "COMPLETED" && potId && amountVal > 0) {
      try {
        const pot = await storage.getPotById(potId);
        if (pot) {
          await storage.updatePot(potId, {
            currentBalance: (pot.currentBalance || 0) + amountVal,
          });

          await ledgerService.postTransaction({
            potId,
            userId,
            type: "deposit",
            amount: amountVal,
            currency: "USD",
            direction: "CREDIT",
            reference: `ref_moov_${transferId}`,
            description: `Moov ACH Deposit to ${pot.name}`,
            status: "completed",
          });
        }
      } catch (err: any) {
        console.warn("[MoovWebhooks] Error syncing completed transfer to pot:", err.message);
      }
    }

    return transferId || "unknown";
  }

  private async processAccountEvent(eventType: string, data: any): Promise<string> {
    const accountID = data.accountID || data.id;
    console.log(`[MoovWebhooks] Account Event ${eventType} received for ${accountID}`);
    return accountID || "account";
  }

  private async processWalletEvent(eventType: string, data: any): Promise<string> {
    const walletID = data.walletID || data.id;
    console.log(`[MoovWebhooks] Wallet Event ${eventType} received for ${walletID}`);
    return walletID || "wallet";
  }
}

export const moovWebhooks = new MoovWebhooks();
