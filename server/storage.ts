import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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
        currentBalance: db.raw`current_balance + ${data.amount}`
      })
      .where(eq(schema.pots.id, data.potId));
  }
  
  // If it's a withdrawal and completed, decrement the pot balance
  if (data.type === "withdrawal" && data.status === "completed" && data.amount) {
    await db.update(schema.pots)
      .set({
        currentBalance: db.raw`current_balance - ${data.amount}`
      })
      .where(eq(schema.pots.id, data.potId));
  }
  
  return transaction;
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
