import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePot } from "@/context/PotContext";
import { useToast } from "@/hooks/use-toast";
import { FaVoteYea, FaTimesCircle, FaExclamationCircle, FaArrowLeft, FaBell } from "react-icons/fa";

export default function VoterDemo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(4);
  const [decisionMade, setDecisionMade] = useState(false);

  // Mock pot data
  const pot = {
    id: "demo-pot-1",
    name: "Team Vacation Fund",
    description: "Saving for our summer team retreat",
    goalAmount: 1200,
    currentBalance: 850,
    withdrawalAmount: 250,
    withdrawalRequester: "Sarah",
    withdrawalReason: "Booking deposit for venue",
    totalMembers: 6,
    votesNeeded: 4,
    voteThreshold: 67
  };

  // Vote on a withdrawal request
  const handleVote = (approve: boolean) => {
    if (approve) {
      setVoteCount(voteCount + 1);
      toast({
        title: "Vote recorded",
        description: "You've approved the withdrawal request",
      });
    } else {
      toast({
        title: "Vote recorded",
        description: "You've declined the withdrawal request",
      });
    }
    
    setHasVoted(true);
    
    // If this vote makes a decision
    if (approve && voteCount + 1 >= pot.votesNeeded) {
      setDecisionMade(true);
      setTimeout(() => {
        toast({
          title: "Withdrawal approved",
          description: `Threshold of ${pot.voteThreshold}% reached. Funds will be released to ${pot.withdrawalRequester}.`,
        });
      }, 1000);
    }
  };

  // Notify admin
  const handleNotifyAdmin = () => {
    toast({
      title: "Admin notified",
      description: "A reminder has been sent to the pot creator about this request",
    });
  };

  // Calculate vote percentage
  const votePercentage = Math.round((voteCount / pot.totalMembers) * 100);
  
  return (
    <div className="max-w-4xl mx-auto slide-in">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => setLocation('/admin')} className="mr-2">
          <FaArrowLeft className="mr-2" /> Back to Admin
        </Button>
        <h1 className="text-2xl font-bold text-primary">Voter Role Demo</h1>
      </div>
      
      <Alert className="mb-4 bg-primary/10 border-primary/20">
        <FaExclamationCircle className="h-4 w-4" />
        <AlertTitle>You are in Voter Role simulation</AlertTitle>
        <AlertDescription>
          This demonstrates the experience of a pot member who can vote on withdrawal requests but doesn't have admin privileges.
        </AlertDescription>
      </Alert>
      
      <Card className="mb-6">
        <CardHeader className="bg-secondary/50">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{pot.name}</CardTitle>
              <CardDescription>{pot.description}</CardDescription>
            </div>
            <Badge className="bg-primary">Voter</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">${pot.currentBalance}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Goal Amount</p>
              <p className="text-2xl font-bold">${pot.goalAmount}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 mb-6">
            <h3 className="font-bold text-destructive mb-2">Withdrawal Request Notification</h3>
            <p className="mb-2">
              <strong>{pot.withdrawalRequester}</strong> has requested a withdrawal of <strong>${pot.withdrawalAmount}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-4">Reason: {pot.withdrawalReason}</p>
            
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">
                  {voteCount} of {pot.totalMembers} votes received
                </span>
                <span className="text-sm font-medium">
                  {votePercentage}% (Threshold: {pot.voteThreshold}%)
                </span>
              </div>
              <Progress value={votePercentage} className="h-2" />
            </div>
            
            {decisionMade ? (
              <div className="bg-primary/10 p-3 rounded-md border border-primary/20 text-center">
                <p className="font-medium text-primary">Approval threshold reached!</p>
                <p className="text-sm">This withdrawal request has been approved.</p>
              </div>
            ) : hasVoted ? (
              <div className="bg-secondary p-3 rounded-md text-center">
                <p className="font-medium">Thank you for voting</p>
                <p className="text-sm text-muted-foreground">Your vote has been recorded</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => handleVote(true)}
                >
                  <FaVoteYea className="mr-2" /> Approve Withdrawal
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => handleVote(false)}
                >
                  <FaTimesCircle className="mr-2" /> Decline
                </Button>
              </div>
            )}
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-bold mb-2">Voting Rules</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Each member gets one vote per withdrawal request</li>
              <li>Withdrawal is approved when {pot.voteThreshold}% threshold is reached</li>
              <li>Members cannot vote on their own withdrawal requests</li>
              <li>Votes cannot be changed once submitted</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="bg-secondary/30 flex justify-between">
          <p className="text-sm text-muted-foreground">
            Voting deadline: 3 days remaining
          </p>
          <Button variant="outline" onClick={handleNotifyAdmin}>
            <FaBell className="mr-2" /> Notify Admin
          </Button>
        </CardFooter>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>As a voter, you can participate in democratic withdrawal decisions but cannot initiate withdrawals or modify pot settings.</p>
      </div>
    </div>
  );
}