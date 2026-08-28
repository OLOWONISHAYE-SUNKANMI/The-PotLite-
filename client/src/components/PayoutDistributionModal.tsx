import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { ArrowUpRight, Users, CheckCircle2, AlertCircle, Percent, DollarSign, Split, Sparkles, Loader2 } from "lucide-react";
import { PotType } from "@/lib/utils";

interface PayoutDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pot: PotType;
}

export type DistributionStrategy = "EQUAL" | "CONTRIBUTION_BASED" | "CUSTOM_PERCENTAGE" | "FIXED_AMOUNT";

export default function PayoutDistributionModal({
  isOpen,
  onClose,
  pot,
}: PayoutDistributionModalProps) {
  const [amount, setAmount] = useState<number>(pot.currentBalance || 100);
  const [strategy, setStrategy] = useState<DistributionStrategy>("EQUAL");
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({});
  const [customFixedAmounts, setCustomFixedAmounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const { addTransaction, withdrawFromPotToPersonal } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();

  const membersList = useMemo(() => {
    if (pot.members && pot.members.length > 0) {
      return pot.members.map((m, idx) => ({
        userId: String(idx + 1),
        userName: m.split("@")[0] || `Member ${idx + 1}`,
        userEmail: m.includes("@") ? m : `${m}@example.com`,
      }));
    }
    return [
      { userId: "1", userName: currentUser || "Admin", userEmail: "admin@thepot.com" },
      { userId: "2", userName: "Sarah", userEmail: "sarah@thepot.com" },
      { userId: "3", userName: "David", userEmail: "david@thepot.com" },
    ];
  }, [pot.members, currentUser]);

  // Calculate live allocations based on strategy
  const calculatedAllocations = useMemo(() => {
    const total = Number(amount) || 0;
    const count = membersList.length;
    if (count === 0 || total <= 0) return [];

    if (strategy === "EQUAL") {
      const base = Math.floor(total / count);
      let rem = total - base * count;
      return membersList.map((m) => {
        const extra = rem > 0 ? 1 : 0;
        if (rem > 0) rem--;
        return { ...m, amount: base + extra };
      });
    }

    if (strategy === "CONTRIBUTION_BASED") {
      // Use memberContributions if available, otherwise mock proportional weights
      const weights = membersList.map((m, idx) => {
        if (pot.memberContributions && pot.memberContributions[m.userEmail]) {
          return pot.memberContributions[m.userEmail];
        }
        return (idx + 1) * 20;
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let assignedTotal = 0;
      const allocs = membersList.map((m, idx) => {
        const share = Math.floor((weights[idx] / totalWeight) * total);
        assignedTotal += share;
        return { ...m, amount: share };
      });
      let rem = total - assignedTotal;
      if (rem > 0 && allocs[0]) allocs[0].amount += rem;
      return allocs;
    }

    if (strategy === "CUSTOM_PERCENTAGE") {
      return membersList.map((m) => {
        const pct = customPercentages[m.userId] !== undefined ? customPercentages[m.userId] : Math.floor(100 / count);
        return { ...m, amount: Math.floor((pct / 100) * total) };
      });
    }

    if (strategy === "FIXED_AMOUNT") {
      return membersList.map((m) => {
        const fixed = customFixedAmounts[m.userId] !== undefined ? customFixedAmounts[m.userId] : Math.floor(total / count);
        return { ...m, amount: fixed };
      });
    }

    return [];
  }, [amount, strategy, membersList, customPercentages, customFixedAmounts, pot.memberContributions]);

  const handleExecutePayout = async () => {
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please specify a payout amount greater than zero.",
        variant: "destructive",
      });
      return;
    }

    if (amount > pot.currentBalance && pot.currentBalance > 0) {
      toast({
        title: "Insufficient Balance",
        description: `Cannot payout ₡${amount}. Pot balance is currently ₡${pot.currentBalance}.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Call Backend Payout API
      const res = await fetch(`/api/pots/${pot.id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          distributionType: strategy,
          members: membersList,
          customAllocations:
            strategy === "CUSTOM_PERCENTAGE"
              ? Object.entries(customPercentages).map(([userId, percentage]) => ({ userId, percentage }))
              : strategy === "FIXED_AMOUNT"
              ? Object.entries(customFixedAmounts).map(([userId, amount]) => ({ userId, amount }))
              : undefined,
          initiatedById: 1,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Payout distribution failed");
      }

      await new Promise((r) => setTimeout(r, 1000));

      // 2. Record transaction in client state
      addTransaction({
        id: `tx_payout_${Math.random().toString(36).substring(2, 10)}`,
        potId: pot.id,
        type: "withdrawal",
        amount,
        user: currentUser || "Admin",
        description: `Programmable payout via ${strategy} across ${calculatedAllocations.length} recipients`,
        timestamp: new Date().toISOString(),
        balanceAfter: Math.max(0, pot.currentBalance - amount),
        status: "completed",
      });

      // 3. Deduct from pot balance in state
      withdrawFromPotToPersonal(pot.id, amount);

      setIsSuccess(true);
      setIsLoading(false);

      toast({
        title: "Payout Executed Successfully!",
        description: `Distributed ₡${amount} to ${calculatedAllocations.length} members using ${strategy} model.`,
      });

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setIsLoading(false);
      toast({
        title: "Payout Error",
        description: err.message || "Failed to execute payout distribution.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Distribute Pot Payout — {pot.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Programmable multi-member payout distribution engine
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Payout Disbursed!</h3>
            <p className="text-sm text-muted-foreground">
              ₡{amount} has been successfully distributed to {calculatedAllocations.length} member wallets.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Payout Amount Field */}
            <div className="bg-secondary/40 p-3 rounded-lg border border-border/50 flex items-center justify-between">
              <div>
                <Label htmlFor="payout-amount" className="text-xs font-semibold text-foreground block">
                  Total Payout Amount (₡)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Available in pot: ₡{pot.currentBalance}
                </span>
              </div>
              <div className="w-32">
                <Input
                  id="payout-amount"
                  type="number"
                  min="1"
                  max={pot.currentBalance || 10000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="font-bold text-right bg-secondary"
                />
              </div>
            </div>

            {/* Distribution Strategy Selector */}
            <div>
              <Label className="text-xs font-semibold text-foreground mb-2 block">
                Distribution Strategy
              </Label>
              <RadioGroup
                value={strategy}
                onValueChange={(val) => setStrategy(val as DistributionStrategy)}
                className="grid grid-cols-2 gap-2"
              >
                <div className={`p-2.5 rounded-lg border flex items-start space-x-2 cursor-pointer transition-all ${strategy === "EQUAL" ? "border-primary bg-primary/10" : "border-border bg-secondary/30"}`}>
                  <RadioGroupItem value="EQUAL" id="strat-equal" className="mt-0.5" />
                  <label htmlFor="strat-equal" className="cursor-pointer">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Split className="w-3.5 h-3.5 text-primary" />
                      Equal Split
                    </div>
                    <p className="text-[10px] text-muted-foreground">Divided evenly among all pot members</p>
                  </label>
                </div>

                <div className={`p-2.5 rounded-lg border flex items-start space-x-2 cursor-pointer transition-all ${strategy === "CONTRIBUTION_BASED" ? "border-primary bg-primary/10" : "border-border bg-secondary/30"}`}>
                  <RadioGroupItem value="CONTRIBUTION_BASED" id="strat-contrib" className="mt-0.5" />
                  <label htmlFor="strat-contrib" className="cursor-pointer">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />
                      Contribution-Based
                    </div>
                    <p className="text-[10px] text-muted-foreground">Proportional to what each member deposited</p>
                  </label>
                </div>

                <div className={`p-2.5 rounded-lg border flex items-start space-x-2 cursor-pointer transition-all ${strategy === "CUSTOM_PERCENTAGE" ? "border-primary bg-primary/10" : "border-border bg-secondary/30"}`}>
                  <RadioGroupItem value="CUSTOM_PERCENTAGE" id="strat-custom-pct" className="mt-0.5" />
                  <label htmlFor="strat-custom-pct" className="cursor-pointer">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-primary" />
                      Custom Percentage
                    </div>
                    <p className="text-[10px] text-muted-foreground">Specify exact percentage per recipient</p>
                  </label>
                </div>

                <div className={`p-2.5 rounded-lg border flex items-start space-x-2 cursor-pointer transition-all ${strategy === "FIXED_AMOUNT" ? "border-primary bg-primary/10" : "border-border bg-secondary/30"}`}>
                  <RadioGroupItem value="FIXED_AMOUNT" id="strat-fixed" className="mt-0.5" />
                  <label htmlFor="strat-fixed" className="cursor-pointer">
                    <div className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Fixed Amounts
                    </div>
                    <p className="text-[10px] text-muted-foreground">Custom coin amount per recipient</p>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Member Allocation Preview Table */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Member Allocations ({calculatedAllocations.length} recipients)
                </Label>
                <span className="text-[11px] text-primary font-bold">
                  Total: ₡{calculatedAllocations.reduce((s, a) => s + a.amount, 0)}
                </span>
              </div>

              <div className="max-h-44 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/40 bg-secondary/20">
                {calculatedAllocations.map((alloc) => (
                  <div key={alloc.userId} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center font-bold text-primary text-[11px]">
                        {alloc.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{alloc.userName}</div>
                        <div className="text-[10px] text-muted-foreground">{alloc.userEmail}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {strategy === "CUSTOM_PERCENTAGE" && (
                        <div className="flex items-center space-x-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={customPercentages[alloc.userId] ?? Math.floor(100 / membersList.length)}
                            onChange={(e) =>
                              setCustomPercentages({
                                ...customPercentages,
                                [alloc.userId]: Number(e.target.value),
                              })
                            }
                            className="w-14 h-7 text-xs text-right bg-secondary"
                          />
                          <span className="text-muted-foreground text-xs">%</span>
                        </div>
                      )}

                      {strategy === "FIXED_AMOUNT" && (
                        <div className="flex items-center space-x-1">
                          <span className="text-muted-foreground text-xs">₡</span>
                          <Input
                            type="number"
                            min="0"
                            value={customFixedAmounts[alloc.userId] ?? Math.floor(amount / membersList.length)}
                            onChange={(e) =>
                              setCustomFixedAmounts({
                                ...customFixedAmounts,
                                [alloc.userId]: Number(e.target.value),
                              })
                            }
                            className="w-16 h-7 text-xs text-right bg-secondary"
                          />
                        </div>
                      )}

                      <div className="text-right font-bold text-primary min-w-16">
                        ₡{alloc.amount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExecutePayout}
                disabled={isLoading || amount <= 0}
                className="flex-1 btn-gradient font-bold"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing Payout...
                  </span>
                ) : (
                  `Execute ₡${amount} Payout`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
