import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import DepositSim from "@/components/DepositSim";
import VotingUI from "@/components/VotingUI";
import TimedRelease from "@/components/TimedRelease";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { cn, formatTimestamp } from "@/lib/utils";

export default function PotDashboard() {
  const { pots, transactions, simulateErrors } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();
  
  // Get the first pot or use a default if no pots exist
  const pot = pots.length > 0 ? pots[0] : null;
  
  // If no pots, show a message to create one
  if (!pot) {
    return (
      <div className="slide-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Welcome to The Pot</h1>
          <p className="text-secondary-foreground">Start by creating a new savings pot</p>
        </div>
        
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h2 className="text-xl font-bold text-primary">No Pots Found</h2>
            <p className="text-secondary-foreground">Create your first Pot to start saving together</p>
            <Link href="/create">
              <Button className="btn-gradient mt-4">
                Create Your First Pot
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }
  
  // Calculate progress percentage
  const progressPercentage = Math.min(100, Math.round((pot.currentBalance / pot.goalAmount) * 100));
  const remaining = pot.goalAmount - pot.currentBalance;
  
  // Get recent transactions for this pot
  const potTransactions = transactions
    .filter(t => t.potId === pot.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);
  
  // Determine if we should show timed release component
  const showTimedRelease = pot.withdrawalMethod === "timed" && pot.releaseDate;
  
  return (
    <div className="slide-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">{pot.name}</h1>
        <p className="text-secondary-foreground">
          {pot.payoutStructure === "one-to-many" ? "One-to-Many" : 
           pot.payoutStructure === "many-to-one" ? "Many-to-One" : "Many-to-Selected"} Pot • 
          {pot.withdrawalMethod === "democratic" ? " Democratic Vote" :
           pot.withdrawalMethod === "admin" ? " Admin Approval" : " Timed Release"}
        </p>
      </div>
      
      {/* Pot Summary Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div className="mb-4 md:mb-0">
              <span className="text-secondary-foreground text-sm">Goal</span>
              <div className="flex items-baseline">
                <h2 className="text-4xl font-bold text-accent mr-2">₡ {pot.goalAmount}</h2>
                <span className="text-sm text-secondary-foreground">dummy coins</span>
              </div>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <span className="text-secondary-foreground text-sm">Current Balance</span>
              <div className="flex items-baseline">
                <h2 className="text-4xl font-bold text-primary">₡ {pot.currentBalance}</h2>
                <span className="text-sm text-secondary-foreground ml-2">dummy coins</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-4 mb-4" />
          
          <div className="flex justify-between text-sm mb-6">
            <span className="text-secondary-foreground">{progressPercentage}% Complete</span>
            <span className="text-secondary-foreground">₡ {remaining} left</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-sm text-secondary-foreground mb-1">Recipients</div>
              <div className="font-medium text-primary">
                {pot.payoutStructure === "many-to-one"
                  ? "Sarah (Single Recipient)"
                  : pot.payoutStructure === "one-to-many"
                    ? "All Members"
                    : "Selected Members"}
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-sm text-secondary-foreground mb-1">Contributors</div>
              <div className="font-medium text-primary">{pot.members.length} Members</div>
            </div>
            <div className="bg-secondary rounded-lg p-3">
              <div className="text-sm text-secondary-foreground mb-1">Withdrawal Method</div>
              <div className="font-medium text-primary">
                {pot.withdrawalMethod === "democratic"
                  ? `Democratic (${pot.voteThreshold}% needed)`
                  : pot.withdrawalMethod === "admin"
                    ? "Admin Approval"
                    : "Timed Release"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Deposit Simulator */}
      <DepositSim potId={pot.id} />
      
      {/* Voting UI (if pot has democratic withdrawal) */}
      {pot.withdrawalMethod === "democratic" && (
        <VotingUI potId={pot.id} />
      )}
      
      {/* Admin Approval UI (if pot has admin withdrawal and user is admin) */}
      {pot.withdrawalMethod === "admin" && pot.creator === currentUser && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-primary mb-4">Admin Approval</h2>
            <div className="bg-secondary rounded-lg p-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                <div>
                  <h3 className="font-medium text-primary">Sarah requested withdrawal</h3>
                  <p className="text-sm text-secondary-foreground">₡ 200 for booking hotel rooms</p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="inline-block px-2 py-1 bg-background rounded text-xs text-secondary-foreground">
                    Pending Approval
                  </span>
                </div>
              </div>
              
              {/* Admin buttons */}
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 mt-3">
                <Button 
                  className="flex-1 bg-[#B8E986] text-secondary font-bold hover:bg-[#A8D976]"
                  onClick={() => {
                    if (simulateErrors.withdrawalRejection) {
                      toast({
                        title: "Error",
                        description: "The withdrawal was blocked due to suspicious activity",
                        variant: "destructive",
                      });
                    } else {
                      toast({
                        title: "Success",
                        description: "Withdrawal approved",
                      });
                    }
                  }}
                >
                  <span className="mr-2">✓</span> Approve
                </Button>
                <Button 
                  className="flex-1 bg-destructive text-secondary font-bold hover:bg-destructive/90"
                  onClick={() => {
                    toast({
                      title: "Rejected",
                      description: "Withdrawal request was rejected",
                    });
                  }}
                >
                  <span className="mr-2">✕</span> Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Timed Release (if pot has timed withdrawal) */}
      {showTimedRelease && (
        <TimedRelease releaseDate={pot.releaseDate!} potId={pot.id} />
      )}
      
      {/* Transaction Log */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-primary">Recent Activity</h2>
            <Link href="/transactions">
              <a className="text-primary text-sm hover:underline">View All</a>
            </Link>
          </div>
          
          <div className="space-y-3">
            {potTransactions.length > 0 ? (
              potTransactions.map(transaction => (
                <div key={transaction.id} className="bg-secondary rounded-lg p-3 slide-in">
                  <div className="flex justify-between items-start">
                    <div>
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
                        {formatTimestamp(transaction.timestamp)}
                      </div>
                    </div>
                    <span className={cn(
                      "inline-block px-2 py-1 rounded text-xs",
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
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-secondary-foreground">
                No recent activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
