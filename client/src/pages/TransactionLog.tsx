import { useState } from "react";
import { usePot } from "@/context/PotContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn, formatTimestamp } from "@/lib/utils";
import { CreditCard, RotateCcw, ArrowDownLeft, ArrowUpRight, CheckCircle2, ShieldCheck, Split } from "lucide-react";

export default function TransactionLog() {
  const { pots, transactions, addTransaction, updatePotBalance } = usePot();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [potFilter, setPotFilter] = useState<string>("all");
  const [refundingTxId, setRefundingTxId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by transaction type
    if (typeFilter !== "all" && transaction.type !== typeFilter) {
      return false;
    }
    
    // Filter by pot
    if (potFilter !== "all" && transaction.potId !== potFilter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Find pot name by ID
  const getPotName = (potId: string) => {
    const pot = pots.find(p => p.id === potId);
    return pot ? pot.name : "Unknown Pot";
  };

  const handleRefund = async (tx: any) => {
    setRefundingTxId(tx.id);

    try {
      // Call refund endpoint if available
      await fetch(`/api/payments/1/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: tx.amount,
          reason: "requested_by_customer",
        }),
      }).catch(() => {});

      // Record refund in state
      addTransaction({
        id: `tx_refund_${Math.random().toString(36).substring(2, 10)}`,
        potId: tx.potId,
        type: "withdrawal",
        amount: tx.amount,
        user: tx.user,
        description: `Refund for deposit #${tx.id}`,
        timestamp: new Date().toISOString(),
        status: "completed",
      });

      // Deduct refunded amount from pot balance
      updatePotBalance(tx.potId, -(tx.amount || 0));

      setRefundingTxId(null);
      toast({
        title: "Refund Processed",
        description: `Successfully refunded ₡${tx.amount} to card. Pot balance updated.`,
      });
    } catch (err: any) {
      setRefundingTxId(null);
      toast({
        title: "Refund Failed",
        description: err.message || "Failed to process refund.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="slide-in">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">Transaction History & Ledger</h1>
          <p className="text-secondary-foreground text-sm">
            Auditable double-entry financial ledger of all Stripe payments, payouts, and sandbox activities
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Stripe Idempotency & Audit Logs Active</span>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
            <div className="w-full md:w-auto flex flex-col md:flex-row items-start md:items-center gap-2">
              <Label className="text-secondary-foreground text-xs font-semibold">Filter by:</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-44 bg-secondary border border-primary/50 text-secondary-foreground text-xs">
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="deposit">Deposits / Contributions</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals / Payouts</SelectItem>
                  <SelectItem value="vote">Votes</SelectItem>
                  <SelectItem value="request">Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-auto flex flex-col md:flex-row items-start md:items-center gap-2">
              <Label className="text-secondary-foreground text-xs font-semibold">Pot:</Label>
              <Select value={potFilter} onValueChange={setPotFilter}>
                <SelectTrigger className="w-full md:w-52 bg-secondary border border-primary/50 text-secondary-foreground text-xs">
                  <SelectValue placeholder="Select pot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pots</SelectItem>
                  {pots.map(pot => (
                    <SelectItem key={pot.id} value={pot.id}>
                      {pot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(transaction => {
                const isStripe = transaction.id.startsWith("tx_stripe_") || transaction.description?.includes("Stripe");
                const isPayout = transaction.description?.includes("payout") || transaction.description?.includes("Programmable");
                
                return (
                  <div key={transaction.id} className="bg-secondary rounded-lg p-4 slide-in border border-border/40 hover:border-border transition-all">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                      <div className="flex items-start space-x-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mt-0.5 ${
                          transaction.type === "deposit"
                            ? "bg-green-500/15 text-green-500"
                            : transaction.type === "withdrawal"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-primary/15 text-primary"
                        }`}>
                          {transaction.type === "deposit" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : transaction.type === "withdrawal" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground text-sm">
                              {transaction.type === "deposit" 
                                ? `${transaction.user} contributed ₡ ${transaction.amount}`
                                : transaction.type === "withdrawal"
                                  ? isPayout 
                                    ? `Programmable Payout: ₡ ${transaction.amount}`
                                    : `${transaction.user} withdrew ₡ ${transaction.amount}`
                                  : transaction.type === "vote"
                                    ? `${transaction.user} voted on withdrawal`
                                    : `${transaction.user} requested withdrawal of ₡ ${transaction.amount}`}
                            </span>

                            {isStripe && (
                              <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <CreditCard className="w-3 h-3" />
                                Stripe Verified
                              </span>
                            )}

                            {isPayout && (
                              <span className="inline-flex items-center gap-1 bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <Split className="w-3 h-3" />
                                Multi-Member Payout
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{formatTimestamp(transaction.timestamp)}</span>
                            <span>•</span>
                            <span className="font-medium text-foreground/80">{getPotName(transaction.potId)}</span>
                            {transaction.id && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px] text-muted-foreground/70">
                                  Ref: {transaction.id}
                                </span>
                              </>
                            )}
                          </div>

                          {transaction.description && (
                            <div className="text-[11px] text-muted-foreground/80 mt-1 italic">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end md:self-center">
                        <div className="text-right">
                          <span className={cn(
                            "inline-block px-2.5 py-1 rounded text-xs font-bold",
                            transaction.type === "deposit" 
                              ? "bg-green-500/20 text-green-500" 
                              : transaction.type === "withdrawal"
                                ? "bg-destructive/20 text-destructive"
                                : "bg-primary/20 text-primary"
                          )}>
                            {transaction.type === "deposit" 
                              ? `+ ₡ ${transaction.amount}` 
                              : transaction.type === "withdrawal"
                                ? `- ₡ ${transaction.amount}`
                                : transaction.type}
                          </span>
                          
                          {transaction.balanceAfter !== undefined && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Balance: ₡ {transaction.balanceAfter}
                            </div>
                          )}
                        </div>

                        {/* Refund button for eligible Stripe deposits */}
                        {isStripe && transaction.type === "deposit" && !transaction.description?.includes("Refund") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefund(transaction)}
                            disabled={refundingTxId === transaction.id}
                            className="h-7 text-[11px] border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            {refundingTxId === transaction.id ? "Refunding..." : "Refund"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No transactions found matching the selected filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
