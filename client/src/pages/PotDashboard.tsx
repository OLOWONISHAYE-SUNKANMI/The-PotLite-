import { useState, useEffect } from "react";
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
import { cn, formatTimestamp, PotType } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, Plus, Info, Clock, Users, CreditCard, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function PotDashboard() {
  const { 
    personalPot, 
    pots, 
    completedPots, 
    transactions, 
    simulateErrors, 
    completePot,
    updatePersonalPotBalance,
    depositFromPersonalToPot,
    withdrawFromPotToPersonal
  } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("active");
  const [selectedPot, setSelectedPot] = useState<string | null>(null);
  const [potDetailTab, setPotDetailTab] = useState<string>("summary");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  
  // No pots to display
  const noActivePots = pots.length === 0;
  const noCompletedPots = completedPots.length === 0;
  
  // Get the currently selected pot or default to the first one in the active/completed list
  const pot = selectedTab === "active"
    ? (selectedPot ? pots.find(p => p.id === selectedPot) || (pots.length > 0 ? pots[0] : null) : (pots.length > 0 ? pots[0] : null))
    : (selectedPot ? completedPots.find(p => p.id === selectedPot) || (completedPots.length > 0 ? completedPots[0] : null) : (completedPots.length > 0 ? completedPots[0] : null));
  
  // When switching tabs, reset the selected pot
  useEffect(() => {
    setSelectedPot(null);
  }, [selectedTab]);
  
  // If no pots in either tab, show a message to create one
  if (noActivePots && noCompletedPots) {
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
  
  // Calculate progress percentage and other pot-related values (with null checks)
  const progressPercentage = pot ? Math.min(100, Math.round((pot.currentBalance / pot.goalAmount) * 100)) : 0;
  const remaining = pot ? pot.goalAmount - pot.currentBalance : 0;
  
  // Get recent transactions for this pot
  const potTransactions = pot ? transactions
    .filter(t => t.potId === pot.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3) : [];
  
  // Determine if we should show timed release component
  const showTimedRelease = pot && pot.withdrawalMethod === "timed" && pot.releaseDate;
  
  return (
    <div className="slide-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Your Pots</h1>
        <p className="text-secondary-foreground">
          View and manage your personal and group savings
        </p>
      </div>
      
      {/* Personal Pot Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-primary mb-1">Personal Pot</h2>
              <p className="text-secondary-foreground text-sm">Your individual savings for contributing to pots</p>
            </div>
            <div className="flex items-baseline mt-4 md:mt-0">
              <span className="text-4xl font-bold text-primary">₡ {personalPot.balance}</span>
              <span className="text-sm text-secondary-foreground ml-2">dummy coins</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-[#B8E986] text-secondary font-bold hover:bg-[#A8D976]">
                  <ArrowUp className="w-4 h-4 mr-2" /> Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Funds to Personal Pot</DialogTitle>
                  <DialogDescription>
                    This simulates adding money from your bank account to your personal pot.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-foreground">₡</span>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      min="1"
                      value={depositAmount || ''}
                      onChange={e => setDepositAmount(Number(e.target.value))}
                      className="pl-8 bg-secondary border border-primary text-secondary-foreground"
                    />
                  </div>
                  <Button 
                    className="w-full bg-[#B8E986] text-secondary font-bold hover:bg-[#A8D976]"
                    onClick={() => {
                      if (depositAmount <= 0) {
                        toast({
                          title: "Error",
                          description: "Please enter a valid amount",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      updatePersonalPotBalance(depositAmount);
                      toast({
                        title: "Success",
                        description: `Added ₡${depositAmount} to your Personal Pot`
                      });
                      setDepositAmount(0);
                    }}
                  >
                    Deposit Funds
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-secondary hover:bg-secondary/90 text-primary font-bold">
                  <ArrowDown className="w-4 h-4 mr-2" /> Withdraw Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds from Personal Pot</DialogTitle>
                  <DialogDescription>
                    This simulates withdrawing money from your personal pot back to your bank account.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-foreground">₡</span>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      min="1"
                      max={personalPot.balance}
                      value={withdrawAmount || ''}
                      onChange={e => setWithdrawAmount(Number(e.target.value))}
                      className="pl-8 bg-secondary border border-primary text-secondary-foreground"
                    />
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      if (withdrawAmount <= 0) {
                        toast({
                          title: "Error",
                          description: "Please enter a valid amount",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      if (withdrawAmount > personalPot.balance) {
                        toast({
                          title: "Error",
                          description: "Insufficient funds in your Personal Pot",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      updatePersonalPotBalance(-withdrawAmount);
                      toast({
                        title: "Success",
                        description: `Withdrew ₡${withdrawAmount} from your Personal Pot`
                      });
                      setWithdrawAmount(0);
                    }}
                  >
                    Withdraw Funds
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Link href="/create">
              <Button className="flex-1 btn-gradient">
                <Plus className="w-4 h-4 mr-2" /> Create Pot
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <Tabs 
        defaultValue="active" 
        className="mb-6" 
        value={selectedTab}
        onValueChange={setSelectedTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="text-base">
            Active Pots {pots.length > 0 && <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">{pots.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-base">
            Cleaned Pots {completedPots.length > 0 && <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">{completedPots.length}</span>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {noActivePots ? (
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <h2 className="text-xl font-bold text-primary">No Active Pots</h2>
                <p className="text-secondary-foreground">Create your first Pot to start saving together</p>
                <Link href="/create">
                  <Button className="btn-gradient mt-2">
                    Create a New Pot
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {pots.map(activePot => (
                <div 
                  key={activePot.id} 
                  className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selectedPot === activePot.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedPot(activePot.id)}
                >
                  <h3 className="font-bold text-lg text-primary">{activePot.name}</h3>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-sm text-secondary-foreground">Goal: ₡ {activePot.goalAmount}</div>
                    <div className="text-sm text-accent font-medium">₡ {activePot.currentBalance}</div>
                  </div>
                  <Progress 
                    value={Math.min(100, Math.round((activePot.currentBalance / activePot.goalAmount) * 100))} 
                    className="h-2 mt-2" 
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          {noCompletedPots ? (
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <h2 className="text-xl font-bold text-primary">No Cleaned Pots</h2>
                <p className="text-secondary-foreground">Complete an active pot to see it here</p>
                {pots.length > 0 && (
                  <div className="text-center mt-2">
                    <p className="text-secondary-foreground mb-2">Have an active pot that's ready to be completed?</p>
                    <Button 
                      onClick={() => {
                        if (pots[0]) {
                          completePot(pots[0].id);
                          toast({
                            title: "Pot Completed",
                            description: `${pots[0].name} has been cleaned and funds paid out.`,
                          });
                        }
                      }}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Complete an Active Pot
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {completedPots.map(completedPot => (
                <div 
                  key={completedPot.id} 
                  className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${selectedPot === completedPot.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedPot(completedPot.id)}
                >
                  <h3 className="font-bold text-lg text-primary">{completedPot.name}</h3>
                  <div className="flex items-center mt-1">
                    <span className="inline-block px-2 py-1 bg-[#B8E986]/20 text-[#B8E986] rounded text-xs mr-2">
                      Completed
                    </span>
                    <span className="text-xs text-secondary-foreground">
                      {completedPot.completedDate ? formatTimestamp(completedPot.completedDate) : ''}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-secondary-foreground">
                    Goal reached: ₡ {completedPot.goalAmount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Pot details - only shown if we have a selected pot */}
      {pot ? (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-primary">{pot.name}</h2>
                <p className="text-secondary-foreground">
                  {pot.payoutStructure === "one-to-many" ? "One-to-Many" : 
                  pot.payoutStructure === "many-to-one" ? "Many-to-One" : "Many-to-Selected"} Pot • 
                  {pot.withdrawalMethod === "democratic" ? " Democratic Vote" :
                  pot.withdrawalMethod === "admin" ? " Admin Approval" : " Timed Release"}
                  {pot.status === 'completed' && " • Completed"}
                </p>
              </div>
              
              {pot.status !== 'completed' && personalPot.balance > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-[#B8E986] text-secondary font-bold hover:bg-[#A8D976]">
                      <ArrowUp className="w-4 h-4 mr-2" /> Deposit from Personal Pot
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Deposit to {pot.name}</DialogTitle>
                      <DialogDescription>
                        Transfer funds from your personal pot to this group pot.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-secondary-foreground mb-1">Personal Pot Balance</p>
                          <p className="font-medium text-primary">₡ {personalPot.balance}</p>
                        </div>
                        <div>
                          <p className="text-sm text-secondary-foreground mb-1">Pot Goal</p>
                          <p className="font-medium text-primary">₡ {pot.goalAmount} (₡ {remaining} left)</p>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-foreground">₡</span>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          min="1"
                          max={personalPot.balance}
                          value={depositAmount || ''}
                          onChange={e => setDepositAmount(Number(e.target.value))}
                          className="pl-8 bg-secondary border border-primary text-secondary-foreground"
                        />
                      </div>
                      <Button 
                        className="w-full bg-[#B8E986] text-secondary font-bold hover:bg-[#A8D976]"
                        onClick={() => {
                          if (depositAmount <= 0) {
                            toast({
                              title: "Error",
                              description: "Please enter a valid amount",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          if (depositAmount > personalPot.balance) {
                            toast({
                              title: "Error",
                              description: "Insufficient funds in your Personal Pot",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          const success = depositFromPersonalToPot(pot.id, depositAmount);
                          if (success) {
                            toast({
                              title: "Success",
                              description: `Deposited ₡${depositAmount} to ${pot.name}`
                            });
                            setDepositAmount(0);
                          } else {
                            toast({
                              title: "Error",
                              description: "Failed to deposit funds",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        Deposit Funds
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {pot.status !== 'completed' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-secondary hover:bg-secondary/90 text-primary font-bold">
                      Request <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem 
                      onClick={() => {
                        // Check if at least 1 contribution has been made
                        if (pot.currentBalance <= 0) {
                          toast({
                            title: "Cannot Withdraw",
                            description: "At least 1 contribution must be made before requesting withdrawal",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Request withdrawal to personal pot
                        const success = withdrawFromPotToPersonal(pot.id, pot.currentBalance);
                        if (success) {
                          toast({
                            title: "Withdrawal Requested",
                            description: `Requested ₡${pot.currentBalance} withdrawal to Personal Pot`
                          });
                        } else {
                          toast({
                            title: "Error",
                            description: "Failed to request withdrawal",
                            variant: "destructive"
                          });
                        }
                      }}
                      disabled={pot.currentBalance <= 0}
                      className={pot.currentBalance <= 0 ? "opacity-50" : ""}
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Withdraw to Personal Pot
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Goal Change Request",
                        description: "Goal change request submitted for review"
                      });
                    }}>
                      <Info className="w-4 h-4 mr-2" />
                      Goal Change
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Contribution/Payout Change",
                        description: "Contribution/Payout change request submitted"
                      });
                    }}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Contribute/Payout Change
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Withdrawal Method Change",
                        description: "Withdrawal method change request submitted"
                      });
                    }}>
                      <Clock className="w-4 h-4 mr-2" />
                      Withdrawal Method Change
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Admin Role Change",
                        description: "Admin role change request submitted"
                      });
                    }}>
                      <Users className="w-4 h-4 mr-2" />
                      Admin Role Change
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      toast({
                        title: "Member Management",
                        description: "Add/Remove members request submitted"
                      });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add/Remove Members
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Pot Summary Card with Tabs */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <div className="mb-4 md:mb-0">
                  <span className="text-secondary-foreground text-sm">Goal</span>
                  <div className="flex items-baseline">
                    <h2 className="text-3xl font-bold text-accent mr-2">₡ {pot.goalAmount}</h2>
                    <span className="text-sm text-secondary-foreground">dummy coins</span>
                  </div>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                  <span className="text-secondary-foreground text-sm">Current Balance</span>
                  <div className="flex items-baseline">
                    <h2 className="text-3xl font-bold text-primary">₡ {pot.currentBalance}</h2>
                    <span className="text-sm text-secondary-foreground ml-2">dummy coins</span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <Progress value={progressPercentage} className="h-3 mb-2" />
              
              <div className="flex justify-between text-sm mb-4">
                <span className="text-secondary-foreground">{progressPercentage}% Complete</span>
                <span className="text-secondary-foreground">₡ {remaining} left</span>
              </div>
              
              {/* Tabbed content for pot details */}
              <Tabs 
                defaultValue="summary" 
                className="mt-4" 
                value={potDetailTab}
                onValueChange={setPotDetailTab}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary" className="text-sm">
                    <Info className="w-4 h-4 mr-2" /> Summary
                  </TabsTrigger>
                  <TabsTrigger value="members" className="text-sm">
                    <Users className="w-4 h-4 mr-2" /> Members
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-sm">
                    <Clock className="w-4 h-4 mr-2" /> Activity
                  </TabsTrigger>
                </TabsList>
                
                {/* Summary Tab */}
                <TabsContent value="summary" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  
                  {/* Only show interactive components for active pots */}
                  {pot.status !== 'completed' && (
                    <>
                      {/* Timed Release (if pot has timed withdrawal) */}
                      {showTimedRelease && (
                        <div className="mt-4">
                          <TimedRelease releaseDate={pot.releaseDate!} potId={pot.id} />
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
                
                {/* Members Tab */}
                <TabsContent value="members" className="mt-4">
                  <div className="bg-secondary rounded-lg p-4">
                    <h3 className="font-medium text-primary mb-3">Members</h3>
                    <div className="space-y-2">
                      {pot.members.map((member, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                              {member.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-primary">{member}</span>
                          </div>
                          {pot.creator === member && (
                            <span className="inline-block px-2 py-1 bg-primary/20 rounded text-xs text-primary">Admin</span>
                          )}
                          {pot.recipients.includes(member) && pot.payoutStructure !== "one-to-many" && (
                            <span className="inline-block px-2 py-1 bg-[#B8E986]/20 rounded text-xs text-[#B8E986]">Recipient</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-4">
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium text-primary">Recent Activity</h3>
                      <Link href="/transactions" className="text-primary text-sm hover:underline">
                        View All
                      </Link>
                    </div>
                    
                    <div className="space-y-3">
                      {potTransactions.length > 0 ? (
                        potTransactions.map(transaction => (
                          <div key={transaction.id} className="bg-background rounded-lg p-3 slide-in">
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
                                    : "bg-primary/20 text-primary"
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
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Only show voting UI for active pots with democratic withdrawal */}
              {pot.status !== 'completed' && pot.withdrawalMethod === "democratic" && (
                <div className="mt-4">
                  <VotingUI potId={pot.id} />
                </div>
              )}
              
              {/* Admin Approval UI (if pot has admin withdrawal and user is admin) */}
              {pot.status !== 'completed' && pot.withdrawalMethod === "admin" && pot.creator === currentUser && (
                <div className="mt-4 bg-secondary rounded-lg p-4">
                  <h3 className="font-medium text-primary mb-3">Admin Approval</h3>
                  <div className="bg-background rounded-lg p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                      <div>
                        <h3 className="font-medium text-primary">Sarah requested withdrawal</h3>
                        <p className="text-sm text-secondary-foreground">₡ 200 for booking hotel rooms</p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <span className="inline-block px-2 py-1 bg-secondary rounded text-xs text-secondary-foreground">
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
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="p-6 text-center">
          <div className="py-8">
            <h2 className="text-xl font-bold text-primary mb-2">Select a Pot</h2>
            <p className="text-secondary-foreground">
              {selectedTab === "active" ? 
                "Select an active pot from above to view details or create a new pot." : 
                "Select a completed pot from above to view its details."}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
