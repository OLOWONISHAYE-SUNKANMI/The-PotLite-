import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectedAccountId: text("stripe_connected_account_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const pots = pgTable("pots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  goalAmount: integer("goal_amount").notNull(),
  currentBalance: integer("current_balance").notNull().default(0),
  currency: text("currency").default("USD").notNull(),
  payoutStructure: text("payout_structure").notNull(), // one-to-many, many-to-one, many-to-selected
  withdrawalMethod: text("withdrawal_method").notNull(), // democratic, admin, timed, auto-withdraw
  voteThreshold: integer("vote_threshold"), // percentage needed for democratic vote
  releaseDate: timestamp("release_date"), // for timed withdrawal
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const potMembers = pgTable("pot_members", {
  id: serial("id").primaryKey(),
  potId: integer("pot_id").references(() => pots.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isRecipient: boolean("is_recipient").default(false).notNull()
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  potId: integer("pot_id").references(() => pots.id).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  amount: integer("amount").notNull(), // in cents or smallest currency unit
  currency: text("currency").default("USD").notNull(),
  status: text("status").default("pending").notNull(), // pending, processing, succeeded, failed, cancelled, refunded, partially_refunded
  paymentMethod: text("payment_method"),
  failureCode: text("failure_code"),
  failureMessage: text("failure_message"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  ownerType: text("owner_type").notNull(), // group, user
  ownerId: text("owner_id").notNull(),
  currency: text("currency").default("USD").notNull(),
  availableBalance: integer("available_balance").default(0).notNull(),
  pendingBalance: integer("pending_balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  potId: integer("pot_id").references(() => pots.id).notNull(),
  initiatedById: integer("initiated_by_id").references(() => users.id),
  amount: integer("amount").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed, cancelled
  distributionType: text("distribution_type").default("EQUAL").notNull(), // EQUAL, CONTRIBUTION_BASED, CUSTOM_PERCENTAGE, FIXED_AMOUNT
  allocations: json("allocations"),
  stripePayoutId: text("stripe_payout_id"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at")
});

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: serial("id").primaryKey(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  processed: boolean("processed").default(false).notNull(),
  processingError: text("processing_error"),
  payload: json("payload"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at")
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  potId: integer("pot_id").references(() => pots.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  paymentId: integer("payment_id").references(() => payments.id),
  payoutId: integer("payout_id").references(() => payouts.id),
  type: text("type").notNull(), // deposit, withdrawal, vote, request, contribution, payout, refund
  amount: integer("amount"),
  currency: text("currency").default("USD"),
  direction: text("direction").default("CREDIT"), // CREDIT, DEBIT
  reference: text("reference"),
  description: text("description"),
  status: text("status").notNull().default("completed"), // pending, completed, failed, rejected, refunded
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name"),
  email: text("email"),
  subscribeToUpdates: boolean("subscribe_to_updates").default(false),
  rating: integer("rating").notNull(),
  likedFeatures: json("liked_features"),
  improvements: text("improvements"),
  useReal: text("use_real"),
  suggestions: text("suggestions"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const potsRelations = relations(pots, ({ many, one }) => ({
  members: many(potMembers),
  creator: one(users, {
    fields: [pots.createdBy],
    references: [users.id]
  }),
  transactions: many(transactions),
  payments: many(payments),
  payouts: many(payouts)
}));

export const potMembersRelations = relations(potMembers, ({ one }) => ({
  pot: one(pots, {
    fields: [potMembers.potId],
    references: [pots.id]
  }),
  user: one(users, {
    fields: [potMembers.userId],
    references: [users.id]
  })
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  pot: one(pots, {
    fields: [payments.potId],
    references: [pots.id]
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id]
  }),
  transactions: many(transactions)
}));

export const payoutsRelations = relations(payouts, ({ one, many }) => ({
  pot: one(pots, {
    fields: [payouts.potId],
    references: [pots.id]
  }),
  initiatedBy: one(users, {
    fields: [payouts.initiatedById],
    references: [users.id]
  }),
  transactions: many(transactions)
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  pot: one(pots, {
    fields: [transactions.potId],
    references: [pots.id]
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  }),
  payment: one(payments, {
    fields: [transactions.paymentId],
    references: [payments.id]
  }),
  payout: one(payouts, {
    fields: [transactions.payoutId],
    references: [payouts.id]
  })
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id]
  })
}));

// Validation schemas
export const insertUserSchema = createInsertSchema(users);
export const insertPotSchema = createInsertSchema(pots);
export const insertPotMemberSchema = createInsertSchema(potMembers);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertWalletSchema = createInsertSchema(wallets);
export const insertPayoutSchema = createInsertSchema(payouts);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertFeedbackSchema = createInsertSchema(feedback);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPot = z.infer<typeof insertPotSchema>;
export type InsertPotMember = z.infer<typeof insertPotMemberSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type User = typeof users.$inferSelect;
export type Pot = typeof pots.$inferSelect;
export type PotMember = typeof potMembers.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;

// Distribution Types enum
export const DistributionType = {
  EQUAL: "EQUAL",
  CONTRIBUTION_BASED: "CONTRIBUTION_BASED",
  CUSTOM_PERCENTAGE: "CUSTOM_PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT"
} as const;

export type DistributionTypeValue = typeof DistributionType[keyof typeof DistributionType];

// AI Pot Draft Schema - for validating N8N webhook responses
export const aiPotDraftSchema = z.object({
  name: z.string().min(1, "Pot name is required"),
  description: z.string().optional(),
  goalAmount: z.number().positive("Goal amount must be positive"),
  payoutStructure: z.enum(["one-to-many", "many-to-one", "many-to-selected"]),
  withdrawalMethod: z.enum(["democratic_vote", "admin_approval", "timed_release", "auto_withdraw"]),
  voteThreshold: z.number().min(0).max(100).optional(),
  releaseDate: z.string().optional() // ISO 8601 date string
});

export type AiPotDraft = z.infer<typeof aiPotDraftSchema>;
