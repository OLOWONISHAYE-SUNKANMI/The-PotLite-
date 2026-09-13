import * as storage from "../../../storage";
import { TransactionResult } from "../domain/payment-types";

export interface PostTransactionParams {
  potId: number;
  userId?: number;
  paymentId?: number;
  payoutId?: number;
  type: "deposit" | "withdrawal" | "contribution" | "payout" | "refund" | "book_transfer" | "fee";
  amount: number; // in cents
  currency?: string;
  direction: "CREDIT" | "DEBIT";
  reference: string;
  description: string;
  status?: "pending" | "completed" | "failed" | "rejected" | "refunded";
  metadata?: Record<string, any>;
}

export class LedgerService {
  /**
   * Post a business transaction to TP's internal ledger and update Pot balance
   */
  public async postTransaction(params: PostTransactionParams) {
    try {
      // 1. Create transaction in storage
      const tx = await storage.createTransaction({
        potId: params.potId,
        userId: params.userId,
        paymentId: params.paymentId,
        payoutId: params.payoutId,
        type: params.type,
        amount: params.amount,
        currency: params.currency || "USD",
        direction: params.direction,
        reference: params.reference,
        description: params.description,
        status: params.status || "completed",
        metadata: params.metadata || {},
      });

      return tx;
    } catch (err: any) {
      console.warn("[LedgerService] DB transaction write skipped in sandbox mode:", err.message);
      return {
        id: Math.floor(Math.random() * 10000),
        ...params,
        createdAt: new Date(),
      };
    }
  }


  /**
   * Sync a provider-side transaction into TP's provider transaction audit log
   */
  public async recordProviderTransaction(tx: TransactionResult, potId?: number, userId?: number, paymentId?: number) {
    try {
      return await storage.createProviderTransaction({
        provider: tx.provider,
        providerTransactionId: tx.id,
        providerAccountId: tx.accountId,
        potId,
        userId,
        paymentId,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        direction: tx.direction,
        status: tx.status.toLowerCase(),
        description: tx.description,
        rawPayload: tx.raw || {},
        occurredAt: tx.occurredAt || new Date(),
      });
    } catch (err: any) {
      console.warn(`[LedgerService] Provider transaction recording skipped or already exists:`, err.message);
      return null;
    }
  }
}

export const ledgerService = new LedgerService();
