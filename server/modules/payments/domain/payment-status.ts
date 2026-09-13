export type StandardPaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

export type PaymentRail = "ach" | "book_payment" | "card" | "transfer";

export type ProviderType = "unit" | "stripe";

export function mapUnitStatusToStandard(unitStatus: string): StandardPaymentStatus {
  switch (unitStatus?.toLowerCase()) {
    case "pending":
      return "PENDING";
    case "clearing":
    case "sent":
    case "processing":
      return "PROCESSING";
    case "cleared":
    case "completed":
    case "success":
    case "open":
    case "active":
      return "COMPLETED";
    case "canceled":
    case "cancelled":
      return "CANCELLED";
    case "returned":
      return "RETURNED";
    case "rejected":
    case "failed":
      return "FAILED";
    default:
      return "PENDING";
  }
}

export function mapStripeStatusToStandard(stripeStatus: string): StandardPaymentStatus {
  switch (stripeStatus?.toLowerCase()) {
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
      return "PENDING";
    case "processing":
      return "PROCESSING";
    case "succeeded":
    case "paid":
      return "COMPLETED";
    case "canceled":
      return "CANCELLED";
    case "failed":
      return "FAILED";
    default:
      return "PENDING";
  }
}
