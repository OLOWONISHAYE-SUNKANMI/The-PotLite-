# Stripe Integration Testing Guide for Replit

This guide covers everything you need to know to test the Stripe payment integration in **The Pot** application while deployed or running in a **Replit** workspace.

---

## 1. Overview of Operating Modes

The Pot application supports dual-mode Stripe operations:

- **Mock Sandbox Mode (Zero Setup)**: Automatically activates if Stripe keys are missing or contain placeholders (`sk_test_51Mock...`). Allows full UI and flow testing without making actual Stripe API calls.
- **Connected Stripe Test Mode (Live Test)**: Activates when valid Stripe Test API keys (`sk_test_...` and `pk_test_...`) are provided in Replit Secrets. Communicates directly with the Stripe Test API and receives real webhook notifications.

---

## 2. Replit Environment Setup (Secrets)

Open the **Secrets** tool (🔒 icon in the Replit left sidebar) and configure the following environment variables:

| Secret Key | Description | Example / Location |
| :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | Stripe Test Secret Key | `sk_test_51...` from [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/test/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Test Publishable Key | `pk_test_51...` from [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/test/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret | `whsec_...` from [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/test/webhooks) |
| `APP_URL` | Your Replit Public URL | `https://<your-repl-name>.<username>.replit.dev` |
| `PORT` | Server Port | `5000` (Replit default) or `3000` |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://...` (Replit Postgres or Neon DB) |

> **Note**: After adding or modifying Secrets in Replit, stop the application and click **Run** to restart with updated variables.

---

## 3. Configuring Stripe Webhooks for Replit

Webhooks allow Stripe to notify your backend asynchronously when events occur (such as completed Checkout sessions or successful PaymentIntents).

### Setting up Endpoint in Stripe Dashboard
1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/test/webhooks).
2. Click **+ Add destination** / **Add endpoint**.
3. In **Endpoint URL**, enter:
   ```
   https://<your-repl-name>.<username>.replit.dev/api/webhooks/stripe
   ```
4. Under **Events to send**, select:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `payout.paid`
   - `payout.failed`
   - `transfer.created`
5. Click **Add endpoint**.
6. Reveal the **Signing secret** (`whsec_...`) and add it to your Replit Secrets as `STRIPE_WEBHOOK_SECRET`.

### Alternative: Local Testing via Stripe CLI (Replit Shell)
In the Replit **Shell** tab:
```bash
# Listen and forward to your local app
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Trigger test events manually
stripe trigger payment_intent.succeeded
stripe trigger checkout.session.completed
```

---

## 4. End-to-End Testing Scenarios

### Scenario A: In-App Stripe Card Deposit (PaymentIntent Flow)
1. Navigate to the **Pot Dashboard** (`/`).
2. Click **"Contribute via Stripe"** or use the **"Deposit Simulation"** card.
3. Select the **Stripe Card** tab.
4. Enter an amount (e.g. `$50.00`). Notice the automatic 2% platform fee calculation (`$1.00`, Total: `$51.00`).
5. Use standard Stripe Test Card credentials:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry Date**: Any future MM/YY (e.g., `12/28`)
   - **CVC**: Any 3 digits (e.g., `123`)
6. Click **Pay with Stripe Card**.
7. **Verification**:
   - Backend calls `POST /api/payments/create-intent`.
   - Pot balance increases by `$50.00`.
   - A transaction with reference `tx_stripe_pi_...` is logged.

---

### Scenario B: Hosted Stripe Checkout Flow
1. Open the Stripe Modal on any Pot.
2. Select the **Stripe Checkout** tab.
3. Enter the desired contribution amount and click **Proceed to Stripe Checkout**.
4. **Verification**:
   - The browser redirects to Stripe's secure hosted page (`checkout.stripe.com`).
   - Enter test card `4242 4242 4242 4242` and complete the checkout.
   - You are redirected back to `https://<your-repl-name>.<username>.replit.dev/?stripe_success=true&session_id=...`.
   - A success banner/toast appears and the pot balance updates.
   - The `checkout.session.completed` webhook confirms transaction reconciliation.

---

### Scenario C: Stripe Refund Processing
1. Navigate to the **Transaction Log** page (`/transactions`).
2. Locate a completed Stripe deposit entry (marked with the **Stripe Verified** badge).
3. Click the **Refund** button on the transaction.
4. **Verification**:
   - Backend calls `POST /api/payments/:id/refund`.
   - Stripe Refund API is triggered.
   - Transaction status updates to `refunded`.
   - An auditable `DEBIT` refund record (`tx_refund_...`) is added to the ledger.

---

### Scenario D: Edge Cases & Failure Resilience
Test application error handling by entering specific Stripe test card numbers:

| Test Case | Card Number | Expected Behavior |
| :--- | :--- | :--- |
| **Declined Card** | `4000 0000 0000 0002` | Red error toast displayed; balance remains unchanged. |
| **Insufficient Funds** | `4000 0000 0000 9995` | `insufficient_funds` error captured and handled gracefully. |
| **3D Secure / OTP Auth** | `4000 0000 0000 3155` | Prompts 3D Secure modal challenge. |
| **Duplicate Webhook** | Resend event from Stripe Dashboard | Webhook handler checks `stripe_webhook_events` table and skips duplicate without double-crediting. |

---

## 5. Summary of API Endpoints

| HTTP Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/stripe/config` | Retrieves publishable key, mock status, and fee parameters |
| `POST` | `/api/payments/create-intent` | Creates a PaymentIntent for in-app card deposits |
| `POST` | `/api/payments/checkout-session` | Creates a Stripe Hosted Checkout session |
| `POST` | `/api/webhooks/stripe` | Authoritative Stripe webhook listener (signature verified) |
| `POST` | `/api/payments/:id/refund` | Issues a full or partial refund via Stripe |
| `POST` | `/api/pots/:id/payout` | Calculates and executes programmable payouts to members |

---

## 6. Monitoring & Troubleshooting

- **Server Console Logs**:
  - `[Stripe] Initialized live Stripe SDK client` &mdash; Indicates valid keys loaded.
  - `[Stripe Webhook] Received Event [payment_intent.succeeded]` &mdash; Confirms webhook delivery.
- **Stripe Dashboard**:
  - View raw API requests in [Stripe Logs](https://dashboard.stripe.com/test/logs).
  - Inspect webhook delivery statuses and payloads in [Stripe Webhook Deliveries](https://dashboard.stripe.com/test/webhooks).
