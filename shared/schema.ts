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
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const pots = pgTable("pots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  goalAmount: integer("goal_amount").notNull(),
  currentBalance: integer("current_balance").notNull().default(0),
  payoutStructure: text("payout_structure").notNull(), // one-to-many, many-to-one, many-to-selected
  withdrawalMethod: text("withdrawal_method").notNull(), // democratic, admin, timed
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

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  potId: integer("pot_id").references(() => pots.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // deposit, withdrawal, vote, request
  amount: integer("amount"),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, completed, rejected
  metadata: json("metadata").$type<{
    balanceAfter?: number;
    voteCount?: number;
    voteTotal?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  rating: integer("rating").notNull(),
  likedFeatures: json("liked_features").$type<string[]>(),
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
  transactions: many(transactions)
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

export const transactionsRelations = relations(transactions, ({ one }) => ({
  pot: one(pots, {
    fields: [transactions.potId],
    references: [pots.id]
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
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
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertFeedbackSchema = createInsertSchema(feedback);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPot = z.infer<typeof insertPotSchema>;
export type InsertPotMember = z.infer<typeof insertPotMemberSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type User = typeof users.$inferSelect;
export type Pot = typeof pots.$inferSelect;
export type PotMember = typeof potMembers.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
