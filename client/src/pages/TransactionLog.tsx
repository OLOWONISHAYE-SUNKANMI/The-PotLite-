import { useState } from "react";
import { usePot } from "@/context/PotContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn, formatTimestamp } from "@/lib/utils";

export default function TransactionLog() {
  const { pots, transactions } = usePot();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [potFilter, setPotFilter] = useState<string>("all");
  
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
  
  return (
    <div className="slide-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Transaction History</h1>
        <p className="text-secondary-foreground">All deposits, votes, and withdrawals for your Pots</p>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="w-full md:w-auto flex flex-col md:flex-row items-start md:items-center mb-4 md:mb-0">
              <Label className="mr-2 text-secondary-foreground mb-1 md:mb-0">Filter by:</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-auto bg-secondary border border-primary text-secondary-foreground">
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="vote">Votes</SelectItem>
                  <SelectItem value="request">Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-auto flex flex-col md:flex-row items-start md:items-center">
              <Label className="mr-2 text-secondary-foreground mb-1 md:mb-0">Pot:</Label>
              <Select value={potFilter} onValueChange={setPotFilter}>
                <SelectTrigger className="w-full md:w-auto bg-secondary border border-primary text-secondary-foreground">
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
              filteredTransactions.map(transaction => (
                <div key={transaction.id} className="bg-secondary rounded-lg p-4 slide-in">
                  <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <div className="mb-2 md:mb-0">
                      <div className="font-medium text-primary">
                        {transaction.type === "deposit" 
                          ? `${transaction.user} deposited ₡ ${transaction.amount}`
                          : transaction.type === "withdrawal"
                            ? `${transaction.user} withdrew ₡ ${transaction.amount}`
                            : transaction.type === "vote"
                              ? `${transaction.user} voted on withdrawal`
                              : `${transaction.user} requested withdrawal of ₡ ${transaction.amount}`}
                      </div>
                      <div className="text-sm text-secondary-foreground">
                        {formatTimestamp(transaction.timestamp)} • {getPotName(transaction.potId)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={cn(
                        "inline-block px-2 py-1 rounded text-xs mr-2",
                        transaction.type === "deposit" 
                          ? "bg-[#B8E986]/20 text-[#B8E986]" 
                          : transaction.type === "withdrawal"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-background/20 text-primary"
                      )}>
                        {transaction.type === "deposit" 
                          ? `+ ₡ ${transaction.amount}` 
                          : transaction.type === "withdrawal"
                            ? `- ₡ ${transaction.amount}`
                            : transaction.type}
                      </span>
                      
                      {transaction.balanceAfter !== undefined && (
                        <div className="text-xs text-secondary-foreground">
                          Balance: ₡ {transaction.balanceAfter}
                        </div>
                      )}
                      
                      {transaction.voteCount !== undefined && transaction.voteTotal !== undefined && (
                        <div className="text-xs text-secondary-foreground">
                          {transaction.voteCount}/{transaction.voteTotal} votes
                        </div>
                      )}
                      
                      {transaction.status && (
                        <div className="text-xs text-secondary-foreground ml-2">
                          {transaction.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-secondary-foreground">
                No transactions found matching the selected filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
