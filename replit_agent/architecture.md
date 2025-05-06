# Architecture Overview

## 1. Overview

This application is a group savings application called "The Pot" that allows users to create shared savings pots, make deposits, and manage withdrawals through various mechanisms. The architecture follows a modern full-stack JavaScript/TypeScript approach with a clear separation between the client and server components.

The application is structured as a monorepo with the following main components:
- React frontend (client)
- Express.js backend (server)
- PostgreSQL database with Drizzle ORM
- Shared TypeScript types and schemas

## 2. System Architecture

The system follows a client-server architecture with:

- **Frontend**: React-based SPA built with Vite
- **Backend**: Express.js API server with RESTful endpoints
- **Database**: PostgreSQL database accessed through Drizzle ORM
- **Deployment**: Configured for deployment on Replit with automatic scaling

The application uses a shared schema definition that enforces type consistency between the frontend and backend. The backend provides RESTful API endpoints that the frontend consumes using Tanstack Query.

## 3. Key Components

### 3.1 Frontend

The frontend is built with:
- **React**: Core UI library
- **TailwindCSS**: For styling with a custom theme
- **ShadCN UI**: Component library built on Radix UI primitives
- **Wouter**: Lightweight routing library
- **React Context**: For state management (PotContext and DummyUserContext)
- **Tanstack Query**: For data fetching and synchronization

The client-side code is organized into:
- `components/`: Reusable UI components
- `pages/`: Route-level components 
- `context/`: React context providers for state management
- `hooks/`: Custom React hooks
- `lib/`: Utility functions and shared logic

### 3.2 Backend

The backend is built with:
- **Express.js**: Web server framework
- **Drizzle ORM**: Type-safe database query builder
- **Neon Serverless Postgres**: Database provider

The server-side code is organized into:
- `server/`: Contains the Express application setup
  - `index.ts`: Main entry point
  - `routes.ts`: API endpoint definitions
  - `storage.ts`: Database access layer
  - `vite.ts`: Integration with Vite for development

### 3.3 Database

The database schema is defined in `shared/schema.ts` using Drizzle ORM and includes:

- **Users**: Account information for application users
- **Pots**: Savings pots with configurable payout and withdrawal rules
- **PotMembers**: Relationships between users and pots (admin status, recipient status)
- **Transactions**: Records of deposits, withdrawals, votes, and requests

The schema design supports different pot configurations:
- Payout structures: one-to-many, many-to-one, many-to-selected
- Withdrawal methods: democratic, admin, timed

### 3.4 Shared Types and Utilities

- `shared/schema.ts`: Contains Drizzle schema definitions and Zod validators
- Type definitions are shared between client and server for consistency

## 4. Data Flow

1. **Client Initialization**:
   - React application renders with initial state
   - Context providers setup application state

2. **API Data Flow**:
   - Client makes requests to `/api` endpoints
   - Server processes requests, interacts with database
   - Server returns JSON responses
   - Client updates state with received data

3. **Pot Management Flow**:
   - Users can create pots with specific configurations
   - Users can deposit funds into pots
   - Withdrawals are managed according to pot configuration:
     - Democratic: Requires voting to reach threshold
     - Admin: Requires admin approval
     - Timed: Automatically releases at specified date

4. **Transaction Logging**:
   - All financial activities are recorded as transactions
   - Transaction history is available for review

## 5. External Dependencies

### 5.1 Frontend Dependencies

- **UI Components**: Radix UI primitives, ShadCN UI components
- **Styling**: TailwindCSS with custom theme configuration
- **Icons**: React-icons, Lucide-react
- **Data Management**: Tanstack Query

### 5.2 Backend Dependencies

- **Database**: Neon Serverless PostgreSQL via `@neondatabase/serverless`
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Validation**: Zod for schema validation
- **Session Management**: Connect-pg-simple for PostgreSQL-based sessions

### 5.3 Development Tools

- **Build Tool**: Vite
- **TypeScript**: For type safety across the application
- **ESBuild**: For server-side code bundling
- **Drizzle Kit**: For database migrations

## 6. Deployment Strategy

The application is configured for deployment on Replit with:

- **Build Process**: 
  - Frontend: Vite build
  - Backend: ESBuild bundling

- **Runtime Configuration**:
  - Environment variables for database connection
  - Production mode optimizations

- **Scaling**:
  - Configured for auto-scaling via Replit's deployment target

- **Database Migration**:
  - Drizzle migrations for schema changes
  - Database seeding script for initial data

## 7. Development Considerations

- **Type Safety**: Strict TypeScript configuration ensures consistency
- **DX**: Development utilities including:
  - Hot module replacement
  - Error overlay
  - Runtime error modal
  - Logging middleware

- **Simulation Mode**:
  - The app includes features for simulating different user roles and scenarios
  - AdminPanel for testing different pot configurations and error states

## 8. Future Considerations

- **Authentication**: The current implementation includes user models but may benefit from a more robust auth system
- **Real-time Updates**: Could be enhanced with WebSockets for live updates
- **Mobile Optimization**: The UI is responsive but could be further optimized for mobile
- **Notifications**: Could implement push or email notifications for pot activity