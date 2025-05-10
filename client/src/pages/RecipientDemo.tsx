import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePot } from "@/context/PotContext";
import { useToast } from "@/hooks/use-toast";
import { 
  FaArrowLeft, 
  FaExclamationCircle, 
  FaMoneyBillWave, 
  FaWallet, 
  FaBell, 
  FaClock, 
  FaDollarSign, 
  FaHourglassHalf 
} from "react-icons/fa";

export default function RecipientDemo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [personalBalance, setPersonalBalance] = useState(350);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);

  // Mock pot data
  const pot = {
    id: "demo-pot-2",
    name: "Birthday Gift Collection",
    description: "Group gift fund for Sarah's upcoming birthday",
    goalAmount: 200,
    currentBalance: 180,
    creator: "Mike",
    members: ["Mike", "Jessica", "David", "Alex", "Emma"],
    payoutStructure: "many-to-one",
    withdrawalMethod: "admin",
    createdAt: "2023-04-15T12:00:00Z",
    estimatedCompletion: "2023-05-20T12:00:00Z"
  };

  // Handle deposit from personal pot
  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive"
      });
      return;
    }
    
    if (amount > personalBalance) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough balance in your personal pot",
        variant: "destructive"
      });
      return;
    }
    
    // Update balances in UI only (simulated)
    setPersonalBalance(prev => prev - amount);
    
    toast({
      title: "Deposit successful",
      description: `You've deposited $${amount} to the pot`,
    });
    
    setDepositAmount('');
  };

  // Handle withdrawal request
  const handleWithdrawalRequest = () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      });
      return;
    }
    
    if (amount > pot.currentBalance) {
      toast({
        title: "Insufficient pot balance",
        description: "The pot doesn't have enough funds for this withdrawal",
        variant: "destructive"
      });
      return;
    }
    
    if (!withdrawalReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for the withdrawal",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate submission
    setHasPendingRequest(true);
    setIsWithdrawalDialogOpen(false);
    
    toast({
      title: "Request submitted",
      description: "Your withdrawal request has been sent to the admin for approval",
    });
    
    setWithdrawalAmount('');
    setWithdrawalReason('');
  };

  // Handle reminder to admin
  const handleSendReminder = () => {
    toast({
      title: "Reminder sent",
      description: "A reminder has been sent to the pot admin",
    });
  };

  // Handle pot detail change request
  const handleRequestChange = (type: string) => {
    toast({
      title: "Change requested",
      description: `Your request to change the ${type} has been sent to the admin`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto slide-in">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => setLocation('/admin')} className="mr-2">
          <FaArrowLeft className="mr-2" /> Back to Admin
        </Button>
        <h1 className="text-2xl font-bold text-primary">Recipient Role Demo</h1>
      </div>
      
      <Alert className="mb-4 bg-primary/10 border-primary/20">
        <FaExclamationCircle className="h-4 w-4" />
        <AlertTitle>You are in Recipient Role simulation</AlertTitle>
        <AlertDescription>
          This demonstrates the experience of a pot member who will receive funds but has limited administrative capabilities.
        </AlertDescription>
      </Alert>
      
      {hasPendingRequest && (
        <Alert className="mb-4 bg-amber-100 border-amber-200">
          <FaHourglassHalf className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800">Pending Withdrawal Request</AlertTitle>
          <AlertDescription className="text-amber-700">
            Your withdrawal request is waiting for admin approval. You'll be notified once it's processed.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="md:col-span-3">
          <CardHeader className="bg-secondary/50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{pot.name}</CardTitle>
                <CardDescription>{pot.description}</CardDescription>
              </div>
              <Badge className="bg-primary">Recipient</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Pot Details</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="actions">Available Actions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Goal Amount</p>
                    <p className="text-2xl font-bold">${pot.goalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold">${pot.currentBalance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payout Structure</p>
                    <p className="font-medium">
                      {pot.payoutStructure === 'many-to-one' ? 'Group funds recipient' : 
                      pot.payoutStructure === 'one-to-many' ? 'Single funder pays group' : 
                      'Group funds selected members'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Withdrawal Method</p>
                    <p className="font-medium">
                      {pot.withdrawalMethod === 'admin' ? 'Admin approval required' : 
                      pot.withdrawalMethod === 'democratic' ? 'Democratic voting' : 
                      'Timed release'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created On</p>
                    <p className="font-medium">{new Date(pot.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Target Completion</p>
                    <p className="font-medium">{new Date(pot.estimatedCompletion).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Separator className="my-4" />
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm text-muted-foreground">Request Pot Detail Changes</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleRequestChange('goal amount')}>
                        <FaDollarSign className="mr-1 h-3 w-3" /> Request Goal Change
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRequestChange('completion date')}>
                        <FaClock className="mr-1 h-3 w-3" /> Request Date Change
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="members">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Creator/Admin:</p>
                    <Badge variant="outline">{pot.creator}</Badge>
                  </div>
                  <Separator />
                  <p className="font-medium">Members:</p>
                  <ul className="space-y-2">
                    {pot.members.map(member => (
                      <li key={member} className="flex justify-between items-center">
                        <span>{member}</span>
                        {member === pot.creator && (
                          <Badge variant="outline" className="bg-secondary/50">Admin</Badge>
                        )}
                        {member === "Current User" && (
                          <Badge className="bg-primary/20">You</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="actions">
                <div className="space-y-4">
                  <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" disabled={hasPendingRequest}>
                        <FaMoneyBillWave className="mr-2" /> Request Withdrawal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Withdrawal</DialogTitle>
                        <DialogDescription>
                          This will send a request to the pot admin for approval.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="withdrawal-amount">Amount</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                            <Input
                              id="withdrawal-amount"
                              className="pl-8"
                              type="number"
                              value={withdrawalAmount}
                              onChange={(e) => setWithdrawalAmount(e.target.value)}
                              min="1"
                              max={pot.currentBalance.toString()}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Available: ${pot.currentBalance}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="withdrawal-reason">Reason</Label>
                          <Textarea
                            id="withdrawal-reason"
                            value={withdrawalReason}
                            onChange={(e) => setWithdrawalReason(e.target.value)}
                            placeholder="Why do you need these funds?"
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWithdrawalDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleWithdrawalRequest}>
                          Submit Request
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="outline" className="w-full" onClick={handleSendReminder}>
                    <FaBell className="mr-2" /> Send Reminder to Admin
                  </Button>
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Recipient Limitations</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>You cannot directly withdraw funds without approval</li>
                    <li>You cannot modify pot settings directly</li>
                    <li>You can only have one pending withdrawal request at a time</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-md">Personal Pot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-4">${personalBalance}</p>
            
            <div className="space-y-3">
              <Label htmlFor="deposit-amount">Deposit Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="deposit-amount"
                  className="pl-8"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="1"
                  max={personalBalance.toString()}
                />
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleDeposit}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0 || parseFloat(depositAmount) > personalBalance}
              >
                <FaWallet className="mr-2" /> Deposit to Pot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>As a recipient, you can view pot details, make deposits, and request withdrawals, but all withdrawals require approval based on the pot's rules.</p>
      </div>
    </div>
  );
}