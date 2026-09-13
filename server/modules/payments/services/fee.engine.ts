export interface FeeBreakdown {
  grossAmount: number; // in cents
  platformFee: number; // in cents
  netAmount: number; // in cents
  isFeeWaived: boolean;
  waiverReason?: string;
  currency: string;
}

export class FeeEngine {
  private readonly defaultFeePercent = 2; // 2%
  private readonly waiverThresholdCents = 10000; // $100.00 threshold for reduced/fee-free rule

  /**
   * Calculate fees applying TP's commercial rules
   * Rule: $100+ Personal Pots or deposits >= $100 enjoy zero platform fee
   */
  public calculateFee(
    amountCents: number,
    potBalanceCents = 0,
    isPersonalPot = false,
    currency = "USD"
  ): FeeBreakdown {
    // Check if eligible for $100+ fee waiver
    const isOverThreshold = amountCents >= this.waiverThresholdCents || (isPersonalPot && potBalanceCents >= this.waiverThresholdCents);

    if (isOverThreshold) {
      return {
        grossAmount: amountCents,
        platformFee: 0,
        netAmount: amountCents,
        isFeeWaived: true,
        waiverReason: "$100+ Personal Pot Benefit: Zero Platform Fees",
        currency,
      };
    }

    const fee = Math.round(amountCents * (this.defaultFeePercent / 100));
    return {
      grossAmount: amountCents,
      platformFee: fee,
      netAmount: amountCents - fee,
      isFeeWaived: false,
      currency,
    };
  }
}

export const feeEngine = new FeeEngine();
