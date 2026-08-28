import Stripe from "stripe";

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "NGN", "CAD", "AUD"];

export function formatStripeAmount(amount: number): number {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Payment amount must be a positive integer in smallest currency unit (e.g. cents)");
  }
  return amount;
}

export function validateCurrency(currency: string = "USD"): string {
  const upper = currency.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(upper)) {
    throw new Error(`Currency '${currency}' is not supported. Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}`);
  }
  return upper.toLowerCase();
}

export function generatePaymentIdempotencyKey(potId: string | number, userId: string | number, timestamp?: number): string {
  return `pot:${potId}:user:${userId}:${timestamp || Date.now()}`;
}

export function generatePayoutIdempotencyKey(payoutId: string | number, recipientId: string | number): string {
  return `payout:${payoutId}:${recipientId}`;
}

export function mapStripeError(error: any): { code: string; message: string } {
  if (error instanceof Stripe.errors.StripeCardError) {
    return {
      code: error.code ? `STRIPE_CARD_${error.code.toUpperCase()}` : "CARD_DECLINED",
      message: error.message || "The card was declined or is invalid.",
    };
  }

  if (error instanceof Stripe.errors.StripeRateLimitError) {
    return {
      code: "STRIPE_RATE_LIMIT",
      message: "Too many requests to payment provider. Please try again shortly.",
    };
  }

  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    return {
      code: "STRIPE_INVALID_REQUEST",
      message: error.message || "Invalid payment parameters provided.",
    };
  }

  if (error instanceof Stripe.errors.StripeAuthenticationError) {
    return {
      code: "STRIPE_AUTH_ERROR",
      message: "Payment gateway configuration error. Check your API keys.",
    };
  }

  if (error instanceof Stripe.errors.StripeConnectionError) {
    return {
      code: "STRIPE_SERVICE_UNAVAILABLE",
      message: "Network communication with payment provider failed.",
    };
  }

  return {
    code: "STRIPE_GENERIC_ERROR",
    message: error.message || "A payment gateway error occurred.",
  };
}
