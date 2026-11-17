# The-PotLite-

ThePotLite V1 Pilot — Youth sports tracking, governance, and accountability.

> *"No money handled. No disputes adjudicated. No obligations silently changed."*

## Overview
ThePotLite V1 is a non-custodial tracking and governance engine for youth sports organizations (directors, coaches, treasurers, and parents). It replaces chasing payments and manual spreadsheets with:
- **Per-Member Versioned Obligations**: Consent-gated state machine where obligations never silently change without recorded acceptance.
- **Dual-Confirmation Off-Rail Payments**: Records cash, Cash App, Zelle, Venmo, checks, and other methods with mutual verification.
- **Cheffy Prompt Dispatcher**: Contextual prompts targeting whoever is currently blocking progress.
- **Dignified Assistance & Sponsorship**: Confidential hardship requests and bilateral repayment promises.
- **4-Level Governance & Group Voting**: Multi-approver payout policies and democratic rules changes.
- **Append-Only Audit Log**: Plain-language immutable timeline per Pot and per member.

## Quick Start
```bash
# Install dependencies
npm install

# Run type check
npm run check

# Run Phase 1 verification tests
npx tsx scripts/test-thepotlite-phase1.ts

# Start development server
npm run dev
```
