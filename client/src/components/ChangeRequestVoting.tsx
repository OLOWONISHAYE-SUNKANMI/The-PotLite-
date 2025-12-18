import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { useToast } from "@/hooks/use-toast";
import { ChangeRequestType, formatTimestamp } from "@/lib/utils";
import { AlertTriangle, Target, Users, Crown, Settings } from "lucide-react";

type ChangeRequestVotingProps = {
  potId: string;
};

export default function ChangeRequestVoting({ potId }: ChangeRequestVotingProps) {
  const { pots, changeRequests, voteOnChangeRequest } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();
  
  const pot = pots.find(p => p.id === potId);
  const pendingRequests = changeRequests.filter(cr => cr.potId === potId && cr.status === 'pending');
  
  if (!pot || pendingRequests.length === 0) return null;
  
  const getRequestIcon = (type: ChangeRequestType['type']) => {
    switch (type) {
      case 'goal-change':
        return <Target className="w-5 h-5 text-blue-500" />;
      case 'admin-change':
        return <Crown className="w-5 h-5 text-amber-500" />;
      case 'contribution-payout-change':
        return <Settings className="w-5 h-5 text-purple-500" />;
      case 'clean-pot':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'withdrawal':
        return <Users className="w-5 h-5 text-green-500" />;
      default:
        return <Settings className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRequestTitle = (type: ChangeRequestType['type']) => {
    switch (type) {
      case 'goal-change':
        return 'Goal Change Request';
      case 'admin-change':
        return 'Admin Change Request';
      case 'contribution-payout-change':
        return 'Contribution/Payout Change';
      case 'clean-pot':
        return 'Clean Pot Early Request';
      case 'withdrawal':
        return 'Withdrawal Request';
      default:
        return 'Change Request';
    }
  };

  const handleVote = (changeRequestId: string, approve: boolean) => {
    const request = pendingRequests.find(r => r.id === changeRequestId);
    if (!request) return;
    
    const hasVoted = request.votes.some(v => v.user === currentUser);
    if (hasVoted) {
      toast({
        title: "Already Voted",
        description: "You have already cast your vote on this request.",
        variant: "destructive",
      });
      return;
    }
    
    voteOnChangeRequest(changeRequestId, currentUser, approve);
    
    toast({
      title: "Vote Recorded",
      description: approve 
        ? "You've approved this change request."
        : "You've rejected this change request."
    });
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Pending Change Requests</h2>
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const totalMembers = pot.members.length;
            const currentVotes = request.votes.length;
            const approvalVotes = request.votes.filter(v => v.approve).length;
            const votePercentage = totalMembers > 0 ? Math.round((approvalVotes / totalMembers) * 100) : 0;
            const hasUserVoted = request.votes.some(v => v.user === currentUser);
            
            return (
              <div key={request.id} className="bg-secondary rounded-lg p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getRequestIcon(request.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-primary">{getRequestTitle(request.type)}</h3>
                      <p className="text-sm text-secondary-foreground">{request.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested by {request.requestedBy} • {formatTimestamp(request.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="inline-block px-2 py-1 bg-background rounded text-xs text-secondary-foreground">
                      {request.status === 'pending' ? 'Pending Votes' : request.status}
                    </span>
                  </div>
                </div>
                
                {request.details.newGoal && request.details.oldGoal && (
                  <div className="bg-background rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-foreground">Current Goal:</span>
                      <span className="font-medium text-primary">₡{request.details.oldGoal}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-foreground">New Goal:</span>
                      <span className="font-medium text-accent">₡{request.details.newGoal}</span>
                    </div>
                  </div>
                )}
                
                {request.details.newAdmin && (
                  <div className="bg-background rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-foreground">New Admin:</span>
                      <span className="font-medium text-primary">{request.details.newAdmin}</span>
                    </div>
                  </div>
                )}
                
                {request.details.cleanPotPayouts && (
                  <div className="bg-background rounded-lg p-3 mb-3">
                    <p className="text-sm text-secondary-foreground mb-2">Proposed Payouts:</p>
                    <div className="space-y-1">
                      {Object.entries(request.details.cleanPotPayouts).map(([member, amount]) => (
                        <div key={member} className="flex items-center justify-between text-sm">
                          <span className="text-secondary-foreground">{member}:</span>
                          <span className="font-medium text-primary">₡{amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-secondary-foreground">
                      {request.approvalMode === 'admin' 
                        ? `Admin Approval Required (${currentVotes} vote${currentVotes !== 1 ? 's' : ''} recorded)`
                        : `Votes: ${currentVotes}/${totalMembers} members (${approvalVotes} approvals)`}
                    </span>
                    <span className="text-secondary-foreground">
                      {request.approvalMode === 'admin'
                        ? 'Awaiting Admin'
                        : `${votePercentage}% (Need ${request.voteThreshold}%)`}
                    </span>
                  </div>
                  <Progress 
                    value={request.approvalMode === 'admin' ? 0 : votePercentage} 
                    className="h-3 mb-4"
                  />
                </div>
                
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                  <Button
                    className="flex-1 bg-[#B8E986] text-secondary font-bold hover:bg-[#A8D976]"
                    onClick={() => handleVote(request.id, true)}
                    disabled={hasUserVoted}
                  >
                    <span className="mr-2">✓</span> Approve
                  </Button>
                  <Button
                    className="flex-1 bg-destructive text-secondary font-bold hover:bg-destructive/90"
                    onClick={() => handleVote(request.id, false)}
                    disabled={hasUserVoted}
                  >
                    <span className="mr-2">✕</span> Reject
                  </Button>
                </div>
                
                {hasUserVoted && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    You have already voted on this request
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
