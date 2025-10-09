# The Pot - Group Savings Application

## Overview

The Pot is a digital group savings application that enables users to pool money toward shared goals with structured payout systems, flexible governance, and transparent transactions. This MVP focuses on sandbox testing with simulated transactions, allowing users to create savings pots, manage deposits/withdrawals, and test various governance models (democratic voting, admin approval, or timed releases).

The application is designed as a social savings platform where groups can collaborate on financial goals ranging from shared expenses (rent, bills) to gift collections and trip planning.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 9, 2025: Splash Screen & Saved Pots
- **Splash Screen**: Implemented one-time splash screen on first app load
  - Full-screen purple gradient overlay with branded logo
  - Displays tagline "Get started with the new Community Banking System"
  - Shows 6 feature bullet points explaining app capabilities
  - Auto-dismisses after 4 seconds or manual skip
  - Uses localStorage (hasSeenSplash) to prevent re-showing
  - Fully responsive with smooth fade animations
  - Respects prefers-reduced-motion accessibility setting
- **Saved Pots Feature**: Users can now bookmark and reuse completed pots
  - New "Saved Pots" tab added to dashboard
  - Bookmark button on each cleaned pot
  - Reuse dialog with "Reuse Same Details" and "Edit Details" options
  - Preserves all pot data (members, settings) while resetting balance to ₡0
- **Personal Pot Updates**: 
  - Title changed to "Personal Pot (Wallet)"
  - Description updated to include "safe place to save funds paid out from Pots"
  - "Create Pot" button changed to "Create a Pot"
  - Promo Code button hidden (functionality preserved)

### October 1, 2025: AI-Assisted Pot Creation
- Implemented AI pot creation feature integrated with N8N workflow
- Added `/ai-create` route with natural language prompt interface
- Backend endpoint `/api/pots/ai-draft` connects to N8N webhook for AI processing
- Frontend confirmation modal allows editing AI-generated pot details before creation
- N8N webhook URL: https://nexark.app.n8n.cloud/webhook/80b7af49-9eca-4f78-b8df-6154b1c641db
- Response transformation handles N8N output structure and field mapping (timedReleaseDate → releaseDate)
- Fixed release date handling: Backend preprocesses ISO strings to Date objects for Drizzle timestamp validation
- Frontend converts ISO dates to datetime-local format for input fields
- Full end-to-end tested with real AI workflow integration including timed release functionality

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TailwindCSS for utility-first styling with custom brand theme
- Shadcn UI component library built on Radix UI primitives for accessible, pre-styled components

**State Management:**
- React Context API with two primary contexts:
  - `PotContext`: Manages pot data, transactions, personal pot balance, and simulation state
  - `DummyUserContext`: Handles user role simulation (admin, voter, recipient)
- Local state with useState/useEffect hooks for component-level interactions
- LocalStorage for persisting user preferences and onboarding status

**Key Frontend Features:**
- Guided onboarding flow for first-time users
- Interactive checklist system to guide sandbox testing
- Role-based demos (voter, recipient, admin) for testing different user perspectives
- Real-time balance updates and transaction simulations
- Error simulation toggles for testing failure scenarios
- Milestone celebration animations for goal achievements
- Responsive design with mobile-first approach

**Routing Structure:**
- `/` - Main pot dashboard
- `/onboarding` - First-time user setup
- `/create` - Pot creation with scenario-based templates
- `/ai-create` - AI-assisted pot creation with natural language input
- `/transactions` - Transaction history log
- `/feedback` - User feedback form
- `/admin` - Admin panel for role simulation and testing
- `/voter-demo` - Voter role simulation
- `/recipient-demo` - Recipient role simulation

### Backend Architecture

**Technology Stack:**
- Express.js as the RESTful API server
- TypeScript for type safety across the stack
- Drizzle ORM for database operations
- Node.js runtime with ES modules

**API Design:**
- RESTful endpoints under `/api` prefix
- Resource-based routing for pots, transactions, and members
- Centralized error handling with Zod validation
- JSON request/response format

**Key API Endpoints:**
- `GET/POST /api/pots` - List and create pots
- `GET/PATCH/DELETE /api/pots/:id` - Individual pot operations
- `POST /api/pots/:id/members` - Add members to pots
- `POST /api/pots/:id/transactions` - Record transactions
- `POST /api/pots/:id/vote` - Cast votes on withdrawals
- `POST /api/pots/ai-draft` - Generate AI-assisted pot draft via N8N webhook
- `POST /api/promo-code/generate` - Generate promo codes (PP/GP types)
- `POST /api/promo-code/verify` - Verify promo codes with merchants

**Business Logic:**
- Promo code engine with eligibility rules (Personal Pot: $5+ balance, Group Pot: goal met)
- In-memory promo code storage for sandbox testing
- AI-assisted pot creation via N8N webhook integration with 15-second timeout
- N8N response transformation (output extraction, field mapping, validation)
- Transaction validation and balance management
- Vote counting and threshold checking
- Timed release date enforcement

### Database Schema

**Core Tables:**
- `users`: User accounts with authentication fields
- `pots`: Savings pots with goal amounts, payout structures, and withdrawal methods
- `pot_members`: Junction table linking users to pots with role flags (admin, recipient)
- `transactions`: All financial activities with metadata (deposits, withdrawals, votes)

**Key Relationships:**
- One-to-many: User → Pots (creator)
- Many-to-many: Users ↔ Pots (via pot_members)
- One-to-many: Pot → Transactions

**Payout Structure Types:**
1. **One-to-Many**: Single depositor, multiple recipients (e.g., allowance distribution)
2. **Many-to-One**: Multiple depositors, single recipient (e.g., gift collection)
3. **Many-to-Selected**: Multiple depositors, selected recipients (e.g., trip expenses)

**Withdrawal Approval Methods:**
1. **Democratic Vote**: Requires majority vote based on configurable threshold
2. **Admin Approval**: Pot creator has sole approval authority
3. **Timed Release**: Funds locked until preset date/time
4. **Auto-Withdraw**: Immediate withdrawal when conditions met

### Data Flow

1. User creates pot via `/create` page with scenario template or custom configuration
2. Frontend validates input and sends POST to `/api/pots`
3. Backend creates pot record and adds creator as admin member
4. Members invited via email/phone simulation (sandbox mode)
5. Deposits update pot balance and create transaction records
6. Withdrawal requests trigger appropriate approval flow (vote/admin/timer)
7. Completed pots moved to archive with final transaction log

### Shared Schema

The `shared/schema.ts` file defines database tables using Drizzle ORM and serves as the single source of truth for data structures. This shared schema is imported by both frontend (for type inference) and backend (for database operations), ensuring type consistency across the entire application.

## External Dependencies

### Database
- **Neon Serverless Postgres**: Cloud-hosted PostgreSQL database with WebSocket support
- **Drizzle ORM**: Type-safe query builder with schema migrations
- Connection via `@neondatabase/serverless` package with WebSocket constructor (ws library)

### UI Components
- **Shadcn UI**: Pre-built component library using Radix UI primitives
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Lucide React**: Icon library for UI elements
- **React Icons**: Additional icon sets (FontAwesome)

### Development Tools
- **Replit-specific plugins**:
  - `@replit/vite-plugin-cartographer`: Development navigation helper
  - `@replit/vite-plugin-runtime-error-modal`: Error overlay for debugging
  - `@replit/vite-plugin-shadcn-theme-json`: Theme configuration support

### Form Management
- **React Hook Form**: Form state management and validation
- **@hookform/resolvers**: Validation resolver for Zod schemas
- **Zod**: Runtime type validation and schema definition

### Data Fetching
- **TanStack Query (React Query)**: Server state management, caching, and synchronization
- Custom query client configuration with credential handling

### Utilities
- **date-fns**: Date formatting and manipulation
- **clsx + tailwind-merge**: Conditional className composition
- **class-variance-authority**: Component variant management
- **nanoid**: Unique ID generation

### Build & Deployment
- **Vite**: Fast build tool with HMR for development
- **esbuild**: Backend bundler for production builds
- **TypeScript**: Type checking across frontend and backend
- **PostCSS + Autoprefixer**: CSS processing pipeline

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express (prepared for future auth)

### Notable Architecture Decisions

**Monorepo Structure**: Frontend and backend share TypeScript types through the `shared/` directory, reducing duplication and ensuring consistency.

**Sandbox Mode**: The application operates in sandbox mode with dummy transactions and simulated errors, allowing users to test all features without real financial risk.

**Context-Based State**: Using React Context instead of Redux/Zustand keeps the architecture simple for the MVP scope while providing centralized state management.

**Scenario-Based Onboarding**: Pre-built use case templates (bills, trips, gifts) guide users through pot creation with realistic examples.

**Role Simulation**: Separate demo pages for voter and recipient roles help users understand different perspectives in the application.

**LocalStorage Persistence**: Critical for sandbox MVP to maintain state across page refreshes without requiring backend persistence for every interaction.