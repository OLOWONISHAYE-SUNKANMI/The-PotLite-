import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { useToast } from "@/hooks/use-toast";

type VotingUIProps = {
  potId: string;
};

export default function VotingUI({ potId }: VotingUIProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const { pots, addTransaction, simulateErrors } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();
  
  // Get the pot details
  const pot = pots.find(p => p.id === potId);
  
  if (!pot) return null;
  
  // Voting stats for display
  const totalMembers = pot.members.length;
  const votesNeeded = Math.ceil((totalMembers * (pot.voteThreshold || 75)) / 100);
  const currentVotes = hasVoted ? 4 : 3; // Simulated vote count
  const votePercentage = Math.round((currentVotes / totalMembers) * 100);
  const isThresholdMet = votePercentage >= (pot.voteThreshold || 75);
  
  const handleVote = (approve: boolean) => {
    if (hasVoted) {
      toast({
        title: "Already Voted",
        description: "You have already cast your vote on this withdrawal.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for error simulation
    if (approve && simulateErrors.withdrawalRejection) {
      toast({
        title: "Vote Failed",
        description: "There was an issue recording your vote. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Record the vote
    addTransaction({
      id: Math.random().toString(36).substring(2, 10),
      potId,
      type: "vote",
      user: currentUser,
      description: approve ? "Approved withdrawal request" : "Rejected withdrawal request",
      timestamp: new Date().toISOString(),
      voteCount: currentVotes + 1,
      voteTotal: totalMembers
    });
    
    setHasVoted(true);
    
    toast({
      title: "Vote Recorded",
      description: approve 
        ? "You've approved the withdrawal request."
        : "You've rejected the withdrawal request."
    });
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Withdrawal Vote</h2>
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
          
          {/* Vote progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-secondary-foreground">
                Votes: {currentVotes}/{totalMembers} members
              </span>
              <span className="text-secondary-foreground">
                {votePercentage}% (Need {pot.voteThreshold || 75}%)
              </span>
            </div>
            <Progress 
              value={votePercentage} 
              className="h-3 mb-4 bg-background"
              style={{
                backgroundColor: 'var(--success)',
              } as React.CSSProperties}
            />
          </div>
          
          {/* Vote buttons */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 mt-3">
            <Button
              className="flex-1 bg-[#B8E986] text-secondary font-bold hover:bg-[#A8D976]"
              onClick={() => handleVote(true)}
              disabled={hasVoted}
            >
              <span className="mr-2">✓</span> Approve
            </Button>
            <Button
              className="flex-1 bg-destructive text-secondary font-bold hover:bg-destructive/90"
              onClick={() => handleVote(false)}
              disabled={hasVoted}
            >
              <span className="mr-2">✕</span> Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
