export interface MemberInfo {
  userId: string | number;
  userName: string;
  userEmail: string;
  stripeConnectedAccountId?: string | null;
}

export interface CalculatedAllocation {
  userId: string | number;
  userName: string;
  userEmail: string;
  amount: number;
  stripeConnectedAccountId?: string | null;
}

export interface CustomAllocationInput {
  userId: string | number;
  percentage?: number;
  amount?: number;
}

export type DistributionType = "EQUAL" | "CONTRIBUTION_BASED" | "CUSTOM_PERCENTAGE" | "FIXED_AMOUNT";

export function calculatePayoutAllocations(
  totalAmount: number,
  distributionType: DistributionType,
  members: MemberInfo[],
  historicalContributions?: Array<{ userId: string | number; amount: number }>,
  customAllocations?: CustomAllocationInput[],
): CalculatedAllocation[] {
  if (!members || members.length === 0) {
    throw new Error("No members in pot to receive payouts");
  }

  if (totalAmount <= 0) {
    throw new Error("Total payout amount must be greater than zero");
  }

  const allocations: CalculatedAllocation[] = [];

  switch (distributionType) {
    case "EQUAL": {
      const count = members.length;
      const baseAmount = Math.floor(totalAmount / count);
      let remainder = totalAmount - baseAmount * count;

      for (const m of members) {
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;

        allocations.push({
          userId: m.userId,
          userName: m.userName,
          userEmail: m.userEmail,
          amount: baseAmount + extra,
          stripeConnectedAccountId: m.stripeConnectedAccountId,
        });
      }
      break;
    }

    case "CONTRIBUTION_BASED": {
      const contribMap = new Map<string | number, number>();
      if (historicalContributions && historicalContributions.length > 0) {
        for (const hc of historicalContributions) {
          const cur = contribMap.get(hc.userId) || 0;
          contribMap.set(hc.userId, cur + hc.amount);
        }
      }

      let totalMemberContributions = 0;
      contribMap.forEach((amount) => {
        totalMemberContributions += amount;
      });

      if (totalMemberContributions <= 0) {
        // Fallback to EQUAL if no historical contributions recorded
        return calculatePayoutAllocations(totalAmount, "EQUAL", members);
      }

      let allocatedTotal = 0;
      for (const m of members) {
        const memberContrib = contribMap.get(m.userId) || 0;
        const share = Math.floor((memberContrib / totalMemberContributions) * totalAmount);
        allocatedTotal += share;

        allocations.push({
          userId: m.userId,
          userName: m.userName,
          userEmail: m.userEmail,
          amount: share,
          stripeConnectedAccountId: m.stripeConnectedAccountId,
        });
      }

      // Distribute any rounding remainder
      let remainder = totalAmount - allocatedTotal;
      for (let i = 0; remainder > 0 && i < allocations.length; i++) {
        allocations[i].amount += 1;
        remainder--;
      }
      break;
    }

    case "CUSTOM_PERCENTAGE": {
      if (!customAllocations || customAllocations.length === 0) {
        throw new Error("Custom percentage allocations are required for CUSTOM_PERCENTAGE distribution");
      }

      const totalPercentage = customAllocations.reduce((sum, a) => sum + (a.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(`Custom percentages must total exactly 100%. Provided: ${totalPercentage}%`);
      }

      let allocatedTotal = 0;
      for (const ca of customAllocations) {
        const member = members.find((m) => String(m.userId) === String(ca.userId));
        if (!member) {
          throw new Error(`User ID ${ca.userId} is not a member of this pot`);
        }
        const share = Math.floor(((ca.percentage || 0) / 100) * totalAmount);
        allocatedTotal += share;

        allocations.push({
          userId: member.userId,
          userName: member.userName,
          userEmail: member.userEmail,
          amount: share,
          stripeConnectedAccountId: member.stripeConnectedAccountId,
        });
      }

      // Adjust rounding remainder to first recipient
      const remainder = totalAmount - allocatedTotal;
      if (allocations.length > 0 && remainder !== 0) {
        allocations[0].amount += remainder;
      }
      break;
    }

    case "FIXED_AMOUNT": {
      if (!customAllocations || customAllocations.length === 0) {
        throw new Error("Custom fixed allocations are required for FIXED_AMOUNT distribution");
      }

      const totalFixed = customAllocations.reduce((sum, a) => sum + (a.amount || 0), 0);
      if (totalFixed !== totalAmount) {
        throw new Error(`Sum of fixed amounts (${totalFixed}) does not match payout total (${totalAmount})`);
      }

      for (const ca of customAllocations) {
        const member = members.find((m) => String(m.userId) === String(ca.userId));
        if (!member) {
          throw new Error(`User ID ${ca.userId} is not a member of this pot`);
        }

        allocations.push({
          userId: member.userId,
          userName: member.userName,
          userEmail: member.userEmail,
          amount: ca.amount || 0,
          stripeConnectedAccountId: member.stripeConnectedAccountId,
        });
      }
      break;
    }
  }

  return allocations;
}
