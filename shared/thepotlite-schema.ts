import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./schema";

/**
 * ============================================================================
 * THEPOTLITE V1 PILOT SCHEMA
 * "No money handled. No disputes adjudicated. No obligations silently changed."
 * ============================================================================
 */

// Organizations: holds org-wide rules, roles, and the payout approval policy
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sport: text("sport").notNull().default("youth_sports"),
  currentRuleVersion: integer("current_rule_version").default(1).notNull(),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Human Rules Engine: Versioned configuration (Section 09 defaults)
export const orgRules = pgTable("org_rules", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  version: integer("version").notNull(),
  // Reminder schedule: 7, 3, 1 days before due; day after; every 2 days x3
  reminderScheduleDays: json("reminder_schedule_days").$type<number[]>().notNull().default([-7, -3, -1, 1, 3, 5, 7]),
  // Grace period before Overdue: 2 days
  gracePeriodDays: integer("grace_period_days").notNull().default(2),
  // Confirmation window: 48 hours
  confirmationWindowHours: integer("confirmation_window_hours").notNull().default(48),
  // Final-notice response window: 12 hours
  finalNoticeResponseWindowHours: integer("final_notice_response_window_hours").notNull().default(12),
  // Invite expiry: 72 hours
  inviteExpiryHours: integer("invite_expiry_hours").notNull().default(72),
  // Auto-removal allowed: On, with the 3 conditions
  autoRemovalAllowed: boolean("auto_removal_allowed").notNull().default(true),
  // Assistance visibility default: Organizers only
  assistanceVisibilityDefault: text("assistance_visibility_default").notNull().default("organizers_only"), // 'organizers_only' | 'organizers_and_group'
  // Vote threshold, quorum, deadline: Majority (50%), 50%, 48 hours
  voteThresholdPercent: integer("vote_threshold_percent").notNull().default(50),
  voteQuorumPercent: integer("vote_quorum_percent").notNull().default(50),
  voteDeadlineHours: integer("vote_deadline_hours").notNull().default(48),
  // Minor-change limit (no vote needed): Deadline extensions only
  minorChangeLimit: text("minor_change_limit").notNull().default("deadline_extensions_only"),
  // Payout approval: 2 approvers above $250; vote above $1,000 (in cents)
  payoutDualApproverThresholdCents: integer("payout_dual_approver_threshold_cents").notNull().default(25000), // $250.00
  payoutVoteThresholdCents: integer("payout_vote_threshold_cents").notNull().default(100000), // $1,000.00
  // Quiet hours: 9 pm – 8 am
  quietHoursStart: text("quiet_hours_start").notNull().default("21:00"),
  quietHoursEnd: text("quiet_hours_end").notNull().default("08:00"),
  // Action table rules: [{ ifState: string, timeSinceField: string, elapsedHours: number, action: string }]
  customConditionActionRules: json("custom_condition_action_rules").$type<Array<{
    conditionState: string;
    elapsedHours: number;
    action: string;
  }>>().default([]),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Teams: belongs to an org; has its families and coach
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  ageGroup: text("age_group"), // e.g. "U12", "Varsity"
  coachUserId: integer("coach_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Players: NOT users. Store only first name and last initial under parent membership (COPPA compliance)
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  parentUserId: integer("parent_user_id").references(() => users.id).notNull(),
  firstName: text("first_name").notNull(),
  lastInitial: text("last_initial").notNull(),
  jerseyNumber: text("jersey_number"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Organization Roles (Organizer vs Member)
export const organizationMembers = pgTable("organization_members", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("Member"), // 'Organizer' | 'Member'
  title: text("title"), // 'Director', 'Coach', 'Treasurer', 'Parent'
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Pots: One collection with a goal, purpose, deadline and rule version snapshot
export const pilotPots = pgTable("pilot_pots", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  teamId: integer("team_id").references(() => teams.id),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  potType: text("pot_type").notNull(), // 'season fee', 'tournament', 'uniforms and gear', 'travel', 'fundraiser', 'other'
  goalAmountCents: integer("goal_amount_cents").notNull(),
  confirmedTotalCents: integer("confirmed_total_cents").notNull().default(0),
  pendingTotalCents: integer("pending_total_cents").notNull().default(0),
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'completed', 'withdrawn', 'cancelled'
  ruleVersionId: integer("rule_version_id").references(() => orgRules.id).notNull(),
  hasChangePending: boolean("has_change_pending").notNull().default(false),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Obligation: THE CORE OBJECT. One per member per Pot.
// States: Invited -> Accepted -> Partially paid -> Paid (pending confirmation) -> Confirmed
// Side states: Overdue, Assistance pending, Change pending, Disputed, Withdrawn, Removed
export const obligations = pgTable("obligations", {
  id: serial("id").primaryKey(),
  potId: integer("pot_id").references(() => pilotPots.id).notNull(),
  memberUserId: integer("member_user_id").references(() => users.id).notNull(),
  playerId: integer("player_id").references(() => players.id), // attached child
  currentVersionNumber: integer("current_version_number").notNull().default(1),
  totalAmountCents: integer("total_amount_cents").notNull(),
  confirmedAmountCents: integer("confirmed_amount_cents").notNull().default(0),
  pendingAmountCents: integer("pending_amount_cents").notNull().default(0),
  state: text("state").notNull().default("Invited"), // Invited, Accepted, Partially paid, Paid (pending confirmation), Confirmed, Overdue, Assistance pending, Change pending, Disputed, Withdrawn, Removed
  previousState: text("previous_state"),
  inviteSentAt: timestamp("invite_sent_at").defaultNow().notNull(),
  inviteExpiresAt: timestamp("invite_expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  withdrawnAt: timestamp("withdrawn_at"),
  withdrawalReason: text("withdrawal_reason"),
  removedAt: timestamp("removed_at"),
  removalReason: text("removal_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Versioned, consent-gated obligation states
// "Governing principle: no obligation changes without the affected person's recorded acceptance."
// Previous version stays in force until the member explicitly accepts the new one.
export const obligationVersions = pgTable("obligation_versions", {
  id: serial("id").primaryKey(),
  obligationId: integer("obligation_id").references(() => obligations.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  amountCents: integer("amount_cents").notNull(),
  scheduleType: text("schedule_type").notNull().default("single"), // 'single' | 'installments'
  changeReason: text("change_reason"), // reason for version creation
  status: text("status").notNull().default("active"), // 'active', 'pending_acceptance', 'declined', 'superseded'
  termsText: text("terms_text"),
  proposedByUserId: integer("proposed_by_user_id").references(() => users.id).notNull(),
  proposedAt: timestamp("proposed_at").defaultNow().notNull(),
  acceptedByUserId: integer("accepted_by_user_id").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Installments: an obligation can be split into dated parts (e.g. $300 season fee as 3 x $100).
// Each installment is confirmed separately.
export const installments = pgTable("installments", {
  id: serial("id").primaryKey(),
  obligationId: integer("obligation_id").references(() => obligations.id).notNull(),
  obligationVersionId: integer("obligation_version_id").references(() => obligationVersions.id).notNull(),
  installmentNumber: integer("installment_number").notNull(),
  amountCents: integer("amount_cents").notNull(),
  confirmedAmountCents: integer("confirmed_amount_cents").notNull().default(0),
  dueDate: timestamp("due_date").notNull(),
  state: text("state").notNull().default("Invited"), // Invited, Accepted, Partially paid, Paid (pending confirmation), Confirmed, Overdue
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Offline Payments: Dual-confirmation tracking (No money handled)
// Cash, Cash App, Zelle, Venmo, check, other app, other.
export const offlinePayments = pgTable("offline_payments", {
  id: serial("id").primaryKey(),
  potId: integer("pot_id").references(() => pilotPots.id).notNull(),
  obligationId: integer("obligation_id").references(() => obligations.id).notNull(),
  installmentId: integer("installment_id").references(() => installments.id),
  amountCents: integer("amount_cents").notNull(),
  method: text("method").notNull(), // 'cash', 'Cash App', 'Zelle', 'Venmo', 'check', 'other app', 'other'
  dateSent: timestamp("date_sent").notNull(),
  referenceNote: text("reference_note"),
  receiptPhotoUrl: text("receipt_photo_url"),
  initiatedByRole: text("initiated_by_role").notNull(), // 'Member' | 'Organizer'
  initiatedByUserId: integer("initiated_by_user_id").references(() => users.id).notNull(),
  payerUserId: integer("payer_user_id").references(() => users.id).notNull(),
  confirmedByUserId: integer("confirmed_by_user_id").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  status: text("status").notNull().default("pending_confirmation"), // 'pending_confirmation', 'confirmed', 'disputed', 'cancelled'
  disputedAt: timestamp("disputed_at"),
  memberStatement: text("member_statement"),
  organizerStatement: text("organizer_statement"),
  confirmationDeadline: timestamp("confirmation_deadline").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Payout Governance: Recorded spend of collected money (org pays vendor off-platform)
// "The requester can never approve their own payout."
export const payoutRecords = pgTable("payout_records", {
  id: serial("id").primaryKey(),
  potId: integer("pot_id").references(() => pilotPots.id).notNull(),
  requestedByUserId: integer("requested_by_user_id").references(() => users.id).notNull(),
  payee: text("payee").notNull(),
  amountCents: integer("amount_cents").notNull(),
  purpose: text("purpose").notNull(),
  dateNeeded: timestamp("date_needed").notNull(),
  status: text("status").notNull().default("pending_approval"), // 'pending_approval', 'approved', 'disbursed', 'rejected'
  requiresVote: boolean("requires_vote").notNull().default(false),
  voteProposalId: integer("vote_proposal_id"),
  rejectionReason: text("rejection_reason"),
  disbursedAt: timestamp("disbursed_at"),
  disbursementMethod: text("disbursement_method"), // 'check', 'card', 'wire', 'cash', 'other'
  receiptInvoiceUrl: text("receipt_invoice_url"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Payout Approvals (Supports multi-approver threshold routing)
export const payoutApprovals = pgTable("payout_approvals", {
  id: serial("id").primaryKey(),
  payoutRecordId: integer("payout_record_id").references(() => payoutRecords.id).notNull(),
  approverUserId: integer("approver_user_id").references(() => users.id).notNull(),
  decision: text("decision").notNull(), // 'approved' | 'rejected'
  reason: text("reason"),
  decidedAt: timestamp("decided_at").defaultNow().notNull()
});

// Assistance Requests (Yellow state: More Time or Financial Help)
export const assistanceRequests = pgTable("assistance_requests", {
  id: serial("id").primaryKey(),
  obligationId: integer("obligation_id").references(() => obligations.id).notNull(),
  memberUserId: integer("member_user_id").references(() => users.id).notNull(),
  needType: text("need_type").notNull(), // 'more_time' | 'financial_help'
  visibility: text("visibility").notNull().default("organizers_only"), // 'organizers_only' | 'organizers_and_group'
  proposedNewDate: timestamp("proposed_new_date"),
  requestedAmountCents: integer("requested_amount_cents"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'countered', 'declined', 'resolved'
  counterProposedDate: timestamp("counter_proposed_date"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Sponsorship & Repayment Records (Separate record from original obligation)
export const sponsorshipRecords = pgTable("sponsorship_records", {
  id: serial("id").primaryKey(),
  obligationId: integer("obligation_id").references(() => obligations.id).notNull(),
  installmentId: integer("installment_id").references(() => installments.id),
  sponsorUserId: integer("sponsor_user_id").references(() => users.id).notNull(),
  coveredMemberUserId: integer("covered_member_user_id").references(() => users.id).notNull(),
  amountCents: integer("amount_cents").notNull(),
  isGift: boolean("is_gift").notNull().default(true),
  repaymentAgreed: boolean("repayment_agreed").notNull().default(false),
  repaymentAmountCents: integer("repayment_amount_cents"),
  repaymentDueDate: timestamp("repayment_due_date"),
  repaymentAcceptedByMember: boolean("repayment_accepted_by_member").notNull().default(false),
  repaymentAcceptedBySponsor: boolean("repayment_accepted_by_sponsor").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Governance Proposals & Group Votes (Level 3 governance)
export const governanceProposals = pgTable("governance_proposals", {
  id: serial("id").primaryKey(),
  potId: integer("pot_id").references(() => pilotPots.id).notNull(),
  createdByUserId: integer("created_by_user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  governanceLevel: integer("governance_level").notNull().default(3), // 2 = Pot terms, 3 = Group vote
  proposedChanges: json("proposed_changes").notNull(),
  quorumPercent: integer("quorum_percent").notNull().default(50),
  thresholdPercent: integer("threshold_percent").notNull().default(50),
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("open"), // 'open', 'passed', 'failed', 'cancelled'
  totalEligibleVoters: integer("total_eligible_voters").notNull().default(0),
  yesCount: integer("yes_count").notNull().default(0),
  noCount: integer("no_count").notNull().default(0),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Governance Individual Votes
export const governanceVotes = pgTable("governance_votes", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => governanceProposals.id).notNull(),
  voterUserId: integer("voter_user_id").references(() => users.id).notNull(),
  vote: text("vote").notNull(), // 'yes' | 'no'
  reason: text("reason"), // Required if vote is 'no'
  votedAt: timestamp("voted_at").defaultNow().notNull()
});

// Cheffy Prompts: Targeted prompt dispatch based on who is waiting on whom
export const cheffyPrompts = pgTable("cheffy_prompts", {
  id: serial("id").primaryKey(),
  recipientUserId: integer("recipient_user_id").references(() => users.id).notNull(),
  potId: integer("pot_id").references(() => pilotPots.id),
  obligationId: integer("obligation_id").references(() => obligations.id),
  triggerType: text("trigger_type").notNull(), // 'invite_unanswered', 'due_date_approaching', 'past_due', 'member_marked_paid', 'organizer_marked_received', 'change_approved', 'vote_open', 'assistance_request', 'payout_requested'
  waitingOn: text("waiting_on").notNull(), // 'Member', 'Organizer', 'Approver'
  promptText: text("prompt_text").notNull(),
  options: json("options").$type<string[]>().notNull(), // e.g. ["Accept", "Decline", "Question"] or ["Green", "Yellow", "Red"]
  selectedOption: text("selected_option"),
  responseNote: text("response_note"),
  status: text("status").notNull().default("pending"), // 'pending', 'responded', 'expired', 'escalated'
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at")
});

// Append-only, timestamped event log (Section 11)
// Records are corrected by new events, never edited or deleted.
export const auditEvents = pgTable("audit_events", {
  id: serial("id").primaryKey(),
  actorUserId: integer("actor_user_id").references(() => users.id),
  actorRole: text("actor_role").notNull(), // 'Organizer' | 'Member' | 'System'
  action: text("action").notNull(),
  objectType: text("object_type").notNull(), // 'Pot', 'Obligation', 'Payment', 'Vote', 'Payout', 'Rule'
  objectId: integer("object_id").notNull(),
  potId: integer("pot_id").references(() => pilotPots.id),
  obligationId: integer("obligation_id").references(() => obligations.id),
  beforeState: json("before_state"),
  afterState: json("after_state"),
  termsVersion: integer("terms_version"),
  ruleVersion: integer("rule_version"),
  plainTextTimelineEntry: text("plain_text_timeline_entry").notNull(), // e.g. "Oct 20: Jordan accepted $125, version 2"
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

/**
 * ============================================================================
 * RELATIONS
 * ============================================================================
 */

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  teams: many(teams),
  rules: many(orgRules),
  members: many(organizationMembers),
  pots: many(pilotPots),
  creator: one(users, {
    fields: [organizations.createdById],
    references: [users.id]
  })
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id]
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id]
  })
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id]
  }),
  players: many(players),
  pots: many(pilotPots),
  coach: one(users, {
    fields: [teams.coachUserId],
    references: [users.id]
  })
}));

export const playersRelations = relations(players, ({ one }) => ({
  organization: one(organizations, {
    fields: [players.organizationId],
    references: [organizations.id]
  }),
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id]
  }),
  parent: one(users, {
    fields: [players.parentUserId],
    references: [users.id]
  })
}));

export const pilotPotsRelations = relations(pilotPots, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [pilotPots.organizationId],
    references: [organizations.id]
  }),
  team: one(teams, {
    fields: [pilotPots.teamId],
    references: [teams.id]
  }),
  ruleVersion: one(orgRules, {
    fields: [pilotPots.ruleVersionId],
    references: [orgRules.id]
  }),
  obligations: many(obligations),
  creator: one(users, {
    fields: [pilotPots.createdById],
    references: [users.id]
  }),
  auditEvents: many(auditEvents)
}));

export const obligationsRelations = relations(obligations, ({ one, many }) => ({
  pot: one(pilotPots, {
    fields: [obligations.potId],
    references: [pilotPots.id]
  }),
  member: one(users, {
    fields: [obligations.memberUserId],
    references: [users.id]
  }),
  player: one(players, {
    fields: [obligations.playerId],
    references: [players.id]
  }),
  versions: many(obligationVersions),
  installments: many(installments),
  payments: many(offlinePayments),
  auditEvents: many(auditEvents)
}));

export const obligationVersionsRelations = relations(obligationVersions, ({ one, many }) => ({
  obligation: one(obligations, {
    fields: [obligationVersions.obligationId],
    references: [obligations.id]
  }),
  installments: many(installments),
  proposedBy: one(users, {
    fields: [obligationVersions.proposedByUserId],
    references: [users.id]
  }),
  acceptedBy: one(users, {
    fields: [obligationVersions.acceptedByUserId],
    references: [users.id]
  })
}));

export const installmentsRelations = relations(installments, ({ one }) => ({
  obligation: one(obligations, {
    fields: [installments.obligationId],
    references: [obligations.id]
  }),
  version: one(obligationVersions, {
    fields: [installments.obligationVersionId],
    references: [obligationVersions.id]
  })
}));

/**
 * ============================================================================
 * ZOD VALIDATION SCHEMAS & TYPES
 * ============================================================================
 */

export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertOrgRuleSchema = createInsertSchema(orgRules);
export const insertTeamSchema = createInsertSchema(teams);
export const insertPlayerSchema = createInsertSchema(players);
export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers);
export const insertPilotPotSchema = createInsertSchema(pilotPots);
export const insertObligationSchema = createInsertSchema(obligations);
export const insertObligationVersionSchema = createInsertSchema(obligationVersions);
export const insertInstallmentSchema = createInsertSchema(installments);
export const insertOfflinePaymentSchema = createInsertSchema(offlinePayments);
export const insertPayoutRecordSchema = createInsertSchema(payoutRecords);
export const insertPayoutApprovalSchema = createInsertSchema(payoutApprovals);
export const insertAssistanceRequestSchema = createInsertSchema(assistanceRequests);
export const insertSponsorshipRecordSchema = createInsertSchema(sponsorshipRecords);
export const insertGovernanceProposalSchema = createInsertSchema(governanceProposals);
export const insertGovernanceVoteSchema = createInsertSchema(governanceVotes);
export const insertCheffyPromptSchema = createInsertSchema(cheffyPrompts);
export const insertAuditEventSchema = createInsertSchema(auditEvents);

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertOrgRule = z.infer<typeof insertOrgRuleSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type InsertPilotPot = z.infer<typeof insertPilotPotSchema>;
export type InsertObligation = z.infer<typeof insertObligationSchema>;
export type InsertObligationVersion = z.infer<typeof insertObligationVersionSchema>;
export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;
export type InsertOfflinePayment = z.infer<typeof insertOfflinePaymentSchema>;
export type InsertPayoutRecord = z.infer<typeof insertPayoutRecordSchema>;
export type InsertPayoutApproval = z.infer<typeof insertPayoutApprovalSchema>;
export type InsertAssistanceRequest = z.infer<typeof insertAssistanceRequestSchema>;
export type InsertSponsorshipRecord = z.infer<typeof insertSponsorshipRecordSchema>;
export type InsertGovernanceProposal = z.infer<typeof insertGovernanceProposalSchema>;
export type InsertGovernanceVote = z.infer<typeof insertGovernanceVoteSchema>;
export type InsertCheffyPrompt = z.infer<typeof insertCheffyPromptSchema>;
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;

export type Organization = typeof organizations.$inferSelect;
export type OrgRule = typeof orgRules.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type PilotPot = typeof pilotPots.$inferSelect;
export type Obligation = typeof obligations.$inferSelect;
export type ObligationVersion = typeof obligationVersions.$inferSelect;
export type Installment = typeof installments.$inferSelect;
export type OfflinePayment = typeof offlinePayments.$inferSelect;
export type PayoutRecord = typeof payoutRecords.$inferSelect;
export type PayoutApproval = typeof payoutApprovals.$inferSelect;
export type AssistanceRequest = typeof assistanceRequests.$inferSelect;
export type SponsorshipRecord = typeof sponsorshipRecords.$inferSelect;
export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type GovernanceVote = typeof governanceVotes.$inferSelect;
export type CheffyPrompt = typeof cheffyPrompts.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;

