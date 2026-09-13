import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Pot operations
export async function getPots() {
  return await db.query.pots.findMany({
    with: {
      creator: true,
      members: {
        with: {
          user: true
        }
      },
      transactions: {
        orderBy: [desc(schema.transactions.createdAt)],
        limit: 10
      }
    },
    orderBy: [desc(schema.pots.createdAt)]
  });
}

export async function getPotById(id: number) {
  return await db.query.pots.findFirst({
    where: eq(schema.pots.id, id),
    with: {
      creator: true,
      members: {
        with: {
          user: true
        }
      },
      transactions: {
        orderBy: [desc(schema.transactions.createdAt)],
        limit: 10
      }
    }
  });
}

export async function createPot(data: schema.InsertPot) {
  const [pot] = await db.insert(schema.pots).values(data).returning();
  return pot;
}

export async function updatePot(id: number, data: Partial<schema.InsertPot>) {
  const [pot] = await db.update(schema.pots)
    .set(data)
    .where(eq(schema.pots.id, id))
    .returning();
  return pot;
}

export async function deletePot(id: number) {
  // First delete all relations
  await db.delete(schema.potMembers).where(eq(schema.potMembers.potId, id));
  await db.delete(schema.transactions).where(eq(schema.transactions.potId, id));
  
  // Then delete the pot
  const [pot] = await db.delete(schema.pots)
    .where(eq(schema.pots.id, id))
    .returning();
  return pot;
}

// Pot members operations
export async function addPotMember(data: schema.InsertPotMember) {
  const [member] = await db.insert(schema.potMembers).values(data).returning();
  return member;
}

export async function removePotMember(potId: number, userId: number) {
  const [member] = await db.delete(schema.potMembers)
    .where(and(
      eq(schema.potMembers.potId, potId),
      eq(schema.potMembers.userId, userId)
    ))
    .returning();
  return member;
}

// Transaction operations
export async function getTransactionsByPotId(potId: number) {
  return await db.query.transactions.findMany({
    where: eq(schema.transactions.potId, potId),
    with: {
      user: true
    },
    orderBy: [desc(schema.transactions.createdAt)]
  });
}

export async function createTransaction(data: schema.InsertTransaction) {
  const [transaction] = await db.insert(schema.transactions).values(data).returning();
  
  // If it's a deposit, update the pot balance
  if (data.type === "deposit" && data.status === "completed" && data.amount) {
    await db.update(schema.pots)
      .set({
        currentBalance: sql`current_balance + ${data.amount}`
      })
      .where(eq(schema.pots.id, data.potId));
  }
  
  // If it's a withdrawal and completed, decrement the pot balance
  if (data.type === "withdrawal" && data.status === "completed" && data.amount) {
    await db.update(schema.pots)
      .set({
        currentBalance: sql`current_balance - ${data.amount}`
      })
      .where(eq(schema.pots.id, data.potId));
  }
  
  return transaction;
}

// Payment operations
export async function createPayment(data: schema.InsertPayment) {
  const [payment] = await db.insert(schema.payments).values(data).returning();
  return payment;
}

export async function getPaymentById(id: number) {
  return await db.query.payments.findFirst({
    where: eq(schema.payments.id, id),
    with: {
      user: true,
      pot: true
    }
  });
}

export async function getPaymentByIntentId(intentId: string) {
  return await db.query.payments.findFirst({
    where: eq(schema.payments.stripePaymentIntentId, intentId),
    with: {
      user: true,
      pot: true
    }
  });
}

export async function updatePayment(id: number, data: Partial<schema.InsertPayment>) {
  const [payment] = await db.update(schema.payments)
    .set(data)
    .where(eq(schema.payments.id, id))
    .returning();
  return payment;
}

// Payout operations
export async function createPayout(data: schema.InsertPayout) {
  const [payout] = await db.insert(schema.payouts).values(data).returning();
  return payout;
}

export async function getPayoutsByPotId(potId: number) {
  return await db.query.payouts.findMany({
    where: eq(schema.payouts.potId, potId),
    with: {
      initiatedBy: true
    },
    orderBy: [desc(schema.payouts.createdAt)]
  });
}

export async function updatePayout(id: number, data: Partial<schema.InsertPayout>) {
  const [payout] = await db.update(schema.payouts)
    .set(data)
    .where(eq(schema.payouts.id, id))
    .returning();
  return payout;
}

export async function getPotMembers(potId: number) {
  return await db.query.potMembers.findMany({
    where: eq(schema.potMembers.potId, potId),
    with: {
      user: true
    }
  });
}

// Feedback operations
export async function createFeedback(data: schema.InsertFeedback) {
  const [feedback] = await db.insert(schema.feedback).values(data).returning();
  return feedback;
}

export async function getAllFeedback() {
  return await db.query.feedback.findMany({
    with: {
      user: true
    },
    orderBy: [desc(schema.feedback.createdAt)]
  });
}

// Financial Accounts
export async function createFinancialAccount(data: schema.InsertFinancialAccount) {
  const [account] = await db.insert(schema.financialAccounts).values(data).returning();
  return account;
}

export async function getFinancialAccountByPotId(potId: number) {
  return await db.query.financialAccounts.findFirst({
    where: eq(schema.financialAccounts.potId, potId)
  });
}

export async function getFinancialAccountsByUserId(userId: number) {
  return await db.query.financialAccounts.findMany({
    where: eq(schema.financialAccounts.userId, userId)
  });
}

export async function getFinancialAccountByProviderAccountId(providerAccountId: string) {
  return await db.query.financialAccounts.findFirst({
    where: eq(schema.financialAccounts.providerAccountId, providerAccountId)
  });
}

export async function updateFinancialAccount(id: number, data: Partial<schema.InsertFinancialAccount>) {
  const [account] = await db.update(schema.financialAccounts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.financialAccounts.id, id))
    .returning();
  return account;
}

// Provider Transactions
export async function createProviderTransaction(data: schema.InsertProviderTransaction) {
  const [tx] = await db.insert(schema.providerTransactions).values(data).returning();
  return tx;
}

export async function getProviderTransactions(limit = 100) {
  return await db.query.providerTransactions.findMany({
    orderBy: [desc(schema.providerTransactions.occurredAt)],
    limit
  });
}

export async function getProviderTransactionByProviderId(providerTransactionId: string) {
  return await db.query.providerTransactions.findFirst({
    where: eq(schema.providerTransactions.providerTransactionId, providerTransactionId)
  });
}

// Provider Webhook Events
export async function createProviderWebhookEvent(data: schema.InsertProviderWebhookEvent) {
  const [event] = await db.insert(schema.providerWebhookEvents).values(data).returning();
  return event;
}

export async function getProviderWebhookEvent(providerEventId: string) {
  return await db.query.providerWebhookEvents.findFirst({
    where: eq(schema.providerWebhookEvents.providerEventId, providerEventId)
  });
}

export async function updateProviderWebhookEvent(id: number, data: Partial<schema.InsertProviderWebhookEvent>) {
  const [event] = await db.update(schema.providerWebhookEvents)
    .set(data)
    .where(eq(schema.providerWebhookEvents.id, id))
    .returning();
  return event;
}

// Reconciliation Records
export async function createReconciliationRecord(data: schema.InsertReconciliationRecord) {
  const [rec] = await db.insert(schema.reconciliationRecords).values(data).returning();
  return rec;
}

export async function getReconciliationRecords(limit = 50) {
  return await db.query.reconciliationRecords.findMany({
    orderBy: [desc(schema.reconciliationRecords.runAt)],
    limit
  });
}

// Payment Methods
export async function createPaymentMethod(data: schema.InsertPaymentMethod) {
  const [method] = await db.insert(schema.paymentMethods).values(data).returning();
  return method;
}

export async function getPaymentMethodsByUserId(userId: number) {
  return await db.query.paymentMethods.findMany({
    where: eq(schema.paymentMethods.userId, userId)
  });
}

// Payments query
export async function getPayments(limit = 100) {
  return await db.query.payments.findMany({
    orderBy: [desc(schema.payments.createdAt)],
    limit,
    with: {
      user: true,
      pot: true
    }
  });
}

