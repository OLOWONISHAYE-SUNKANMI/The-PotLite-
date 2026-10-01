# The Pot — MVP Gap Analysis & Milestone Development Roadmap

This document details the architectural and functional gap analysis of **The Pot** application across the frontend and backend, followed by a structured milestone implementation plan targeting an **Alpha Feature Complete milestone on October 1** and a **Public MVP Launch on October 15**.

---

## 1. Executive Summary & Current Architecture

The current repository serves as a **single-browser sandbox/demo prototype**. While the UI components (Shadcn / Tailwind) and data models (Drizzle ORM) are well established, state is largely stored in browser `localStorage` and managed via React Context (`PotContext.tsx`, `DummyUserContext.tsx`).

```
+----------------------------------------------------------------------------------------------------+
|                                     CURRENT ARCHITECTURE VS MVP                                    |
+--------------------------------+-----------------------------------+-------------------------------+
|             AREA               |       CURRENT SANDBOX STATE       |        TARGET MVP STATE       |
+--------------------------------+-----------------------------------+-------------------------------+
| User Identity & Access         | Mock single user ("Current User") | Multi-user Auth (Bcrypt/Cookie)|
| Data Persistence               | LocalStorage / Client React State | PostgreSQL Database via API   |
| Group Governance & Voting      | Simulated in-browser state        | Database Voting State Machine |
| Member Invitations             | Mock email string list            | Tokenized Links & Email Dispatch|
| Personal Wallet                | Raw number in LocalStorage        | Atomic User Wallet & Ledger   |
| Payments & Wallets Rail        | Simulated Sandbox / Stripe Mock   | Moov Gateway (Low ACH, Wallets)|
| Timed Release Pots             | Client-side countdown timer       | Background Scheduler (Cron)   |
| Demo vs Live Experience        | Mixed sandbox/demo components     | Clean SaaS UI with Gated Admin|
+--------------------------------+-----------------------------------+-------------------------------+
```

---

## 2. Frontend Gap Analysis

### 2.1. State Management & API Data Synchronization
* **Current State**: Reads and mutations occur in `localStorage` (`thePot_pots`, `thePot_transactions`, `thePot_personalPot`, `thePot_savedPots`).
* **Gaps**:
  * Changes made by User A do not reflect for User B on another device.
  * Clearing browser cache wipes all application data.
* **Required Implementation**:
  * Replace `localStorage` reads/writes with **TanStack React Query** hooked into Express REST API endpoints (`/api/pots`, `/api/pots/:id`, `/api/transactions`).
  * Implement active query invalidation and refetch-on-focus to ensure real-time balance and voting sync.

### 2.2. Authentication & User Profile Interface
* **Current State**: `DummyUserContext.tsx` hardcodes `"Current User"` and allows switching roles via a demo dropdown.
* **Gaps**:
  * No sign-in, registration, password recovery, or profile management pages.
* **Required Implementation**:
  * Build `/login`, `/register`, and `/forgot-password` pages with schema validation (`react-hook-form` + `zod`).
  * Implement an `AuthContext` to expose authenticated user state (`id`, `name`, `email`, `avatar`).
  * Add route protection wrappers that redirect unauthenticated users to `/login`.

### 2.3. Member Invitations & Public Landing Page
* **Current State**: Inviting members in `CreatePot.tsx` and `PotInviteSystem.tsx` only adds email strings to a local state array.
* **Gaps**:
  * No public landing page for invited friends to view pot goals and accept invitations.
* **Required Implementation**:
  * Create a public `/join/:inviteToken` page displaying pot details (Goal, Creator, Rules) with an "Accept & Join" action.
  * Add an in-app invite modal with one-click **"Copy Link"** and social sharing links.

### 2.4. Governance & Voting UI Modernization
* **Current State**:
  * `VotingUI.tsx` contains static, hardcoded demo copy ("Sarah requested withdrawal ₡200").
  * `ChangeRequestVoting.tsx` allows the local browser to simulate votes without server verification.
* **Gaps**:
  * Static demo voting creates confusion with real pot change requests.
* **Required Implementation**:
  * Deprecate and remove the static `VotingUI.tsx` mock.
  * Upgrade `ChangeRequestVoting.tsx` to dynamically query active requests from the database, displaying voter progress bars, quorum requirements, and member vote statuses.

### 2.5. Demo Scaffolding Separation
* **Current State**: Sandbox tools (`FeatureChecklist.tsx`, `/admin` error toggles, `/voter-demo`, `/recipient-demo`, `ErrorSimulationHandler.tsx`) are visible in primary navigation.
* **Gaps**:
  * Real end users should not see developer debugging tools in production.
* **Required Implementation**:
  * Place demo/sandbox tools behind an environment flag (`VITE_ENABLE_DEMO_MODE=false`) or restrict them to super-admin user roles.
  * Convert `FeatureChecklist` into a genuine new-user onboarding guide ("Complete Profile", "Create Pot", "Invite Friends").

---

## 3. Backend & Database Gap Analysis

### 3.1. Authentication, Sessions & RBAC
* **Current State**: Routes assume `userId = 1` or accept arbitrary IDs in request bodies without verification.
* **Gaps**:
  * Any visitor can modify, delete, or withdraw from any pot.
* **Required Implementation**:
  * Add authentication routes (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`).
  * Integrate session persistence with `connect-pg-simple` and `bcrypt` password hashing.
  * Add authorization middleware (`requireAuth`, `requirePotMember`, `requirePotAdmin`).

### 3.2. Pot & Member Database Management
* **Current State**: Backend contains schema definitions in `shared/schema.ts`, but operations are not fully wired into the client.
* **Gaps**:
  * Deleting a pot does not cascade properly across all relations without transaction safety.
* **Required Implementation**:
  * Ensure full CRUD support in `server/storage.ts` with atomic PostgreSQL transactions (`db.transaction`).
  * Implement membership queries: `GET /api/pots` returns only pots where the authenticated user is creator or member.

### 3.3. Change Request & Voting State Machine
* **Current State**: Pot actions (Goal Change, Admin Transfer, Clean Pot Early, Member Removal) do not have backend endpoints.
* **Gaps**:
  * Voting resolutions cannot be enforced server-side.
* **Required Implementation**:
  * Create `change_requests` and `votes` database tables.
  * Implement `POST /api/pots/:id/requests` and `POST /api/requests/:id/vote`.
  * Build an automated resolution evaluator: when votes meet `vote_threshold`, the requested change is automatically committed to the database.

### 3.4. Personal Wallet & Double-Entry Ledger
* **Current State**: Personal Pot balances are stored locally in the browser.
* **Gaps**:
  * Moving money from Personal Pot to Group Pot lacks double-entry accounting integrity.
* **Required Implementation**:
  * Connect the `wallets` table to track individual user balances.
  * Implement atomic transfer endpoints (`POST /api/wallets/transfer-to-pot`, `POST /api/pots/payout-to-wallet`).
  * Record immutable transaction logs for all balance shifts.

### 3.5. Background Scheduler for Timed Releases
* **Current State**: `pots.releaseDate` exists in the database schema, but has no execution trigger.
* **Gaps**:
  * Timed release pots remain locked after the release date unless manually triggered.
* **Required Implementation**:
  * Implement a background worker using `node-cron` or `pg-boss` (runs every 5–10 minutes).
  * Automatically identify expired pots (`release_date <= NOW()`), unlock available balances, and notify members.

### 3.6. Transactional Communications (Email/SMS)
* **Current State**: Invitations and notifications are simulated in local UI toasts.
* **Gaps**:
  * Users cannot be notified when invited to a pot, when a vote is required, or when funds are released.
* **Required Implementation**:
  * Integrate an email delivery service (Resend, SendGrid, or AWS SES).
  * Build email templates for: Pot Invitation, Vote Required, Goal Reached, and Payout Unlocked.

### 3.7. Promo Code & Saved Pots Persistence
* **Current State**: `promoCodeEngine.ts` stores codes in RAM; saved pots live in `localStorage`.
* **Gaps**:
  * Codes and saved pots are lost on server restart or browser cache clear.
* **Required Implementation**:
  * Add database tables `promo_codes` and `saved_pots`.
  * Persist code generation and redemption history to PostgreSQL.

---

## 4. Milestone Implementation Roadmap

```
Timeline Overview:
[Sept 1 – Sept 14]       [Sept 15 – Sept 24]       [Sept 25 – Oct 1]        [Oct 2 – Oct 10]         [Oct 11 – Oct 15]
    MILESTONE 1               MILESTONE 2              MILESTONE 3             MILESTONE 4              MILESTONE 5
 ─────────────────         ─────────────────        ─────────────────       ─────────────────        ─────────────────
 Core Auth, DB Sync       Invites, Governance,     Timed Release Cron,     Security, QA, Polish,    Deployment, Launch,
 & Real User Accounts     Dynamic Voting Engine     Wallet & Alpha Freeze    Demo/Live Separation     Post-Launch Ops
```

---

### 📌 Milestone 1: Multi-User Identity, Auth & Core DB Migration
**Target Window**: September 1 – September 14  
**Primary Focus**: Transition from single-user LocalStorage sandbox to authenticated, multi-user database architecture.

| Component | Task Description | Deliverables |
| :--- | :--- | :--- |
| **Backend Auth** | • Implement `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.<br>• Configure session persistence via `connect-pg-simple` and password hashing with `bcrypt`.<br>• Add `requireAuth` and `requirePotMember` route middlewares. | Secure, cookie-based session authentication. |
| **Frontend Auth** | • Build `/login`, `/register`, and `/forgot-password` pages with validation.<br>• Replace `DummyUserContext` with real `AuthContext`.<br>• Protect private routes and add dynamic user profile dropdown in Navbar. | End-to-end user signup and login flow. |
| **Database Persistence** | • Migrate `PotDashboard`, `CreatePot`, and `TransactionLog` from `localStorage` to React Query API calls.<br>• Associate all newly created pots with `req.user.id`.<br>• Enforce atomic PostgreSQL transactions for balance updates. | Persistent multi-user database storage. |
| **Personal Wallet Backend** | • Connect `wallets` table to track user balances with atomic deposit/transfer operations. | Database-persisted user wallets. |
| **Cleanup** | • Remove obsolete files (`CreatePot.tsx.bak`, `CreatePot.tsx.original`). | Clean, unbloated codebase. |

---

### 📌 Milestone 2: Pot Invitations & Real-Time Governance Voting
**Target Window**: September 15 – September 24  
**Primary Focus**: Enable collaborative group saving with shareable invite links and dynamic multi-party voting.

| Component | Task Description | Deliverables |
| :--- | :--- | :--- |
| **Invitation Engine** | • Create `pot_invitations` table and `/api/pots/:id/invites` endpoint.<br>• Generate secure, unique invite tokens.<br>• Integrate transactional email provider (Resend / SendGrid) to dispatch invitations.<br>• Build public landing page `/join/:inviteToken` for new and existing users. | Complete shareable link and email invitation system. |
| **Governance Engine** | • Build backend endpoints: `GET/POST /api/pots/:id/requests` and `POST /api/requests/:id/vote`.<br>• Implement server-side voting resolution (Democratic threshold calculation and Admin-only mode).<br>• Automatically commit approved changes (Goal change, Admin transfer, Clean pot) to the database. | Automated multi-party governance system. |
| **Voting UI Modernization**| • Remove legacy mock `VotingUI.tsx`.<br>• Upgrade `ChangeRequestVoting.tsx` to display real-time member vote progress bars and active requests. | Dynamic, real-time voting interface. |

---

### 📌 Milestone 3: Automation, Wallet Ledger & Alpha Freeze
**Target Window**: September 25 – **October 1 (Target Date 1: Feature Complete Alpha)**  
**Primary Focus**: Lifecycle automation, persistent promo codes, and complete feature freeze for Alpha testing.

| Component | Task Description | Deliverables |
| :--- | :--- | :--- |
| **Moov Gateway & Wallets** | • Integrate `@moovio/sdk` with unified Client, Accounts, Transfers, Simulations, and HMAC-SHA512 Webhooks.<br>• Map Personal & Group Pots to Moov Wallets (`wallet.balance`).<br>• Enable low-cost Inbound ACH debits and Outbound ACH credits.<br>• Implement instant zero-marginal-cost wallet-to-wallet pot contributions.<br>• Connect sandbox stress testing simulation endpoints. | Primary payment coordination and wallet engine locked in. |
| **Timed Release Cron** | • Implement server-side cron scheduler (`node-cron`) running every 5–10 minutes.<br>• Identify expired pots (`release_date <= NOW()`) and automatically unlock funds.<br>• Dispatch notification emails to members when a pot unlocks. | Automated timed-release lifecycle worker. |
| **Promo Codes & Saved Pots**| • Migrate `promoCodeEngine.ts` from RAM to `promo_codes` PostgreSQL table.<br>• Persist saved/bookmarked pot templates in the database for cross-device reuse. | Persistent promo code and template system. |
| **AI Pot Creator Hardening**| • Add timeout handling (10s), error fallbacks, and direct database persistence for `/ai-create`. | Robust AI pot creation flow. |
| **Alpha Freeze (Oct 1)** | • Complete end-to-end multi-device testing (Pot creation -> Email invite -> Member join -> Vote -> Payout). | **Feature Complete Alpha Prototype** 🎯 |


---

### 📌 Milestone 4: Security, QA, Mobile Polish & Demo Separation
**Target Window**: October 2 – October 10  
**Primary Focus**: Security hardening, mobile optimization, and clean separation between sandbox tools and live SaaS.

| Component | Task Description | Deliverables |
| :--- | :--- | :--- |
| **Demo / Live Separation** | • Add `VITE_ENABLE_DEMO_MODE` environment flag to gate `/admin`, role switchers, and error simulators.<br>• Convert `FeatureChecklist` into a user onboarding checklist ("Verify Email", "Create Pot", "Invite Friends"). | Production-ready SaaS interface. |
| **Mobile & UX Polish** | • Optimize confirmation modal tables, pot summary cards, and transaction logs for mobile viewports.<br>• Add loading skeletons, empty states, and accessibility enhancements (ARIA labels, focus traps). | Fully responsive mobile & desktop UX. |
| **Security Hardening** | • Add `express-rate-limit` on auth, invite, and AI endpoints.<br>• Configure Helmet security headers, CORS restrictions, and strict input validation via Zod. | Production-grade security compliance. |

---

### 📌 Milestone 5: Production Deployment & Public Launch
**Target Window**: October 11 – **October 15 (Target Date 2: Public MVP Launch)**  
**Primary Focus**: Production infrastructure provisioning, monitoring, smoke testing, and public release.

| Component | Task Description | Deliverables |
| :--- | :--- | :--- |
| **Production Setup** | • Deploy frontend and backend to production hosting (Replit Deployments / Render / AWS).<br>• Provision production PostgreSQL database (Neon / Supabase).<br>• Configure custom domain, DNS records, and SSL certificates. | Live production environment. |
| **Monitoring & Alerting** | • Integrate Sentry for real-time frontend and backend error tracking.<br>• Set up uptime monitoring (Better Uptime) and automated database backup routines. | 24/7 observability and error reporting. |
| **Public Launch (Oct 15)** | • Perform final production smoke test across all user journeys.<br>• Open registration and execute public launch. | **Official Public MVP Launch 🚀** |

---

## 5. Milestone Summary & Progress Tracker

| Milestone | Window | Focus Area | Status |
| :--- | :--- | :--- | :---: |
| **M1** | Sept 1 – Sept 14 | Multi-User Auth, Session Management & DB Migration | `[ Planned ]` |
| **M2** | Sept 15 – Sept 24 | Email Invites, Public `/join` Links & Dynamic Governance | `[ Planned ]` |
| **M3** | Sept 25 – **Oct 1** | Moov Gateway & Wallets, Timed Release & **Alpha Freeze** | `[ In Progress ]` 🚀 |
| **M4** | Oct 2 – Oct 10 | Security Hardening, Mobile Polish & Demo Separation | `[ Planned ]` |
| **M5** | Oct 11 – **Oct 15** | Production Infrastructure, Monitoring & **Public Launch** | `[ Planned ]` |

