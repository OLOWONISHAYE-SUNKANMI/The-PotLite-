import { useState, useEffect } from "react";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import DepositSim from "@/components/DepositSim";
import VotingUI from "@/components/VotingUI";
import ChangeRequestVoting from "@/components/ChangeRequestVoting";
import TimedRelease from "@/components/TimedRelease";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { cn, formatTimestamp, PotType, generateId } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, Plus, Info, Clock, Users, CreditCard, ChevronDown, AlertTriangle, Crown, Sparkles, Bookmark } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MilestoneCelebration from "@/components/MilestoneCelebration";
import PotInviteSystem from "@/components/PotInviteSystem";
import StripePaymentModal from "@/components/StripePaymentModal";
import PayoutDistributionModal from "@/components/PayoutDistributionModal";
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
    savedPots,
    transactions,
    changeRequests,
    simulateErrors, 
    completePot,
    savePot,
    unsavePot,
    updatePersonalPotBalance,
    depositFromPersonalToPot,
    withdrawFromPotToPersonal,
    approveWithdrawalToPersonal,
    addTransaction,
    addChangeRequest,
    voteOnChangeRequest,
    addPot
  } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("active");
  const [selectedPot, setSelectedPot] = useState<string | null>(null);
  const [potDetailTab, setPotDetailTab] = useState<string>("summary");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState<boolean>(false);
  const [showGoalChangeDialog, setShowGoalChangeDialog] = useState<boolean>(false);
  const [newGoalAmount, setNewGoalAmount] = useState<number>(0);
  const [showContributionPayoutDialog, setShowContributionPayoutDialog] = useState<boolean>(false);
  const [showAdminChangeDialog, setShowAdminChangeDialog] = useState<boolean>(false);
  const [showMemberManagementDialog, setShowMemberManagementDialog] = useState<boolean>(false);
  const [showCleanPotDialog, setShowCleanPotDialog] = useState<boolean>(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string>("");
  const [memberToRemove, setMemberToRemove] = useState<string>("");
  const [newMemberInput, setNewMemberInput] = useState<string>("");
  const [tempMemberContributions, setTempMemberContributions] = useState<Record<string, number>>({});
  const [tempMemberPayouts, setTempMemberPayouts] = useState<Record<string, number>>({});
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState<boolean>(false);
  const [currentMilestone, setCurrentMilestone] = useState<any>(null);
  const [voteAdmission, setVoteAdmission] = useState<string>("democratic");
  const [showInviteSystem, setShowInviteSystem] = useState<boolean>(false);
  const [generatedPromoCode, setGeneratedPromoCode] = useState<string>("");
  const [showPromoCodeDialog, setShowPromoCodeDialog] = useState<boolean>(false);
  const [isGeneratingPromoCode, setIsGeneratingPromoCode] = useState<boolean>(false);
  const [showReuseDialog, setShowReuseDialog] = useState<boolean>(false);
  const [selectedSavedPot, setSelectedSavedPot] = useState<PotType | null>(null);
  const [showStripeModal, setShowStripeModal] = useState<boolean>(false);
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);

  // Check URL params for Stripe Checkout success/cancellation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    const sessionId = params.get("session_id");

    if (paymentStatus === "success") {
      toast({
        title: "Stripe Payment Succeeded!",
        description: `Your contribution was processed successfully. Transaction reference: ${sessionId || "verified"}`,
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your Stripe Checkout session was cancelled.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);
  
  // No pots to display
  const noActivePots = pots.length === 0;
  const noCompletedPots = completedPots.length === 0;
  const noSavedPots = savedPots.length === 0;
  
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
              <h2 className="text-xl font-bold text-primary mb-1">Personal Pot (Wallet)</h2>
              <p className="text-secondary-foreground text-sm">Your individual savings for contributing to pots and your safe place to save funds paid out from Pots</p>
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
            
            <Link href="/ai-create" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold">
                <Sparkles className="w-4 h-4 mr-2" /> Create a Pot with Cheffy AI
              </Button>
            </Link>
            
            <div className="flex flex-1 gap-3">
              <Link href="/create" className="flex-1">
                <Button className="w-full btn-gradient">
                  <Plus className="w-4 h-4 mr-2" /> Create a Pot
                </Button>
              </Link>
              
              <Dialog open={showPromoCodeDialog} onOpenChange={setShowPromoCodeDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="hidden bg-purple-600 text-white hover:bg-purple-700 text-sm px-2"
                    disabled={personalPot.balance < 5}
                    title="Generate Promo Code (requires ₡5 minimum balance)"
                  >
                    🎫 Promo Code
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Promo Code</DialogTitle>
                  <DialogDescription>
                    Generate a promo code for your Personal Pot. Requires at least ₡5 balance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {personalPot.balance < 5 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-700 text-sm">
                        <strong>Insufficient Balance:</strong> You need at least ₡5 in your Personal Pot to generate a promo code.
                        Current balance: ₡{personalPot.balance}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-700 text-sm">
                          <strong>Eligible:</strong> Your Personal Pot balance of ₡{personalPot.balance} meets the minimum requirement.
                        </p>
                      </div>
                      
                      {generatedPromoCode && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-2">Your Promo Code:</h4>
                          <div className="bg-white border rounded p-3 font-mono text-lg text-center">
                            {generatedPromoCode}
                          </div>
                          <p className="text-blue-700 text-xs mt-2">
                            This code can be used once at participating merchants.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowPromoCodeDialog(false);
                            setGeneratedPromoCode("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={async () => {
                            setIsGeneratingPromoCode(true);
                            try {
                              const response = await fetch('/api/promo-code/generate', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  userId: currentUser,
                                  potId: 'personal-pot',
                                  potType: 'PP',
                                  userBalance: personalPot.balance,
                                  potGoalStatus: 'NOT_MET'
                                }),
                              });
                              
                              const data = await response.json();
                              
                              if (response.ok) {
                                setGeneratedPromoCode(data.promoCode);
                                toast({
                                  title: "Promo Code Generated!",
                                  description: `Your promo code ${data.promoCode} is ready to use.`,
                                });
                              } else {
                                toast({
                                  title: "Generation Failed",
                                  description: data.message || "Failed to generate promo code",
                                  variant: "destructive"
                                });
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to generate promo code. Please try again.",
                                variant: "destructive"
                              });
                            } finally {
                              setIsGeneratingPromoCode(false);
                            }
                          }}
                          disabled={isGeneratingPromoCode || generatedPromoCode !== ""}
                        >
                          {isGeneratingPromoCode ? "Generating..." : "Generate Code"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs 
        defaultValue="active" 
        className="mb-6" 
        value={selectedTab}
        onValueChange={setSelectedTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="text-base">
            Active Pots {pots.length > 0 && <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">{pots.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-base">
            Cleaned Pots {completedPots.length > 0 && <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">{completedPots.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="saved" className="text-base">
            Saved Pots {savedPots.length > 0 && <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">{savedPots.length}</span>}
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
                  className={`bg-card border rounded-xl p-4 transition-all hover:shadow-md ${selectedPot === completedPot.id ? 'ring-2 ring-primary' : ''} relative`}
                >
                  <div className="cursor-pointer" onClick={() => setSelectedPot(completedPot.id)}>
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      savePot(completedPot.id);
                      toast({
                        title: "Pot Saved",
                        description: `${completedPot.name} has been saved for reuse.`,
                      });
                    }}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="mt-4">
          {noSavedPots ? (
            <Card className="p-6 text-center">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <h2 className="text-xl font-bold text-primary">No Saved Pots</h2>
                <p className="text-secondary-foreground">Save a completed pot to reuse it later with the same members and settings</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {savedPots.map(savedPot => (
                <div 
                  key={savedPot.id} 
                  className="bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md relative"
                  onClick={() => {
                    setSelectedSavedPot(savedPot);
                    setShowReuseDialog(true);
                  }}
                >
                  <h3 className="font-bold text-lg text-primary">{savedPot.name}</h3>
                  <div className="flex items-center mt-1">
                    <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-600 rounded text-xs mr-2">
                      Saved
                    </span>
                    <span className="text-xs text-secondary-foreground">
                      {savedPot.members?.length || 0} members
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-secondary-foreground">
                    Goal: ₡ {savedPot.goalAmount}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      unsavePot(savedPot.id);
                      toast({
                        title: "Pot Removed",
                        description: `${savedPot.name} has been removed from saved pots.`,
                      });
                    }}
                  >
                    <Bookmark className="h-4 w-4 fill-current" />
                  </Button>
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
                          
                          // Check for milestone celebrations before deposit
                          const newBalance = pot.currentBalance + depositAmount;
                          const milestones = [100, 250, 500, 1000, 2500, 5000];
                          const reachedMilestone = milestones.find(m => 
                            pot.currentBalance < m && newBalance >= m
                          );
                          
                          const success = depositFromPersonalToPot(pot.id, depositAmount);
                          if (success) {
                            // Check if goal is reached
                            if (pot.currentBalance < pot.goalAmount && newBalance >= pot.goalAmount) {
                              setCurrentMilestone({
                                title: "Goal Achieved!",
                                amount: pot.goalAmount,
                                description: `Congratulations! ${pot.name} has reached its target goal!`,
                                type: 'goal_reached'
                              });
                              setShowMilestoneCelebration(true);
                            } else if (reachedMilestone) {
                              setCurrentMilestone({
                                title: "Savings Milestone Reached!",
                                amount: reachedMilestone,
                                description: `Amazing! You've reached ₡${reachedMilestone} in total contributions!`,
                                type: 'contribution_milestone'
                              });
                              setShowMilestoneCelebration(true);
                            }
                            
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
                        
                        // Check payout structure restrictions
                        if (pot.payoutStructure === "many-to-one") {
                          toast({
                            title: "Withdrawal Not Allowed",
                            description: "Many-to-One pots cannot withdraw until goal is reached and withdrawal method allows it",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Open withdrawal dialog for amount input
                        setWithdrawAmount(0);
                        setShowWithdrawDialog(true);
                      }}
                      disabled={pot.currentBalance <= 0 || pot.payoutStructure === "many-to-one"}
                      className={pot.currentBalance <= 0 || pot.payoutStructure === "many-to-one" ? "opacity-50" : ""}
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Withdraw to Personal Pot
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      setNewGoalAmount(pot.goalAmount);
                      setShowGoalChangeDialog(true);
                    }}>
                      <Info className="w-4 h-4 mr-2" />
                      Goal Change
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      // Initialize with current pot settings
                      if (pot.memberContributions) {
                        setTempMemberContributions(pot.memberContributions);
                      }
                      if (pot.memberPayouts) {
                        setTempMemberPayouts(pot.memberPayouts);
                      }
                      setShowContributionPayoutDialog(true);
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
                      setSelectedNewAdmin("");
                      setShowAdminChangeDialog(true);
                    }}>
                      <Users className="w-4 h-4 mr-2" />
                      Admin Role Change
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      setShowInviteSystem(true);
                    }}>
                      <Users className="w-4 h-4 mr-2" />
                      Invite/Remove Members
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      setShowStripeModal(true);
                    }}>
                      <CreditCard className="w-4 h-4 mr-2 text-primary" />
                      Contribute via Stripe
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => {
                      setShowPayoutModal(true);
                    }}>
                      <ArrowUp className="w-4 h-4 mr-2 text-primary" />
                      Distribute Pot Payout
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => {
                      // Initialize clean pot dialog with current member payouts
                      if (pot.memberPayouts) {
                        setTempMemberPayouts(pot.memberPayouts);
                      }
                      setShowCleanPotDialog(true);
                    }}>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Clean The Pot Early
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
                          ? (pot.recipients && pot.recipients.length > 0 
                              ? `${pot.recipients[0]} (Single Recipient)` 
                              : "No Recipient Set")
                          : pot.payoutStructure === "one-to-many"
                            ? "All Members"
                            : (pot.recipients && pot.recipients.length > 0 
                                ? pot.recipients.join(", ") 
                                : "No Recipients Set")}
                      </div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3">
                      <div className="text-sm text-secondary-foreground mb-1">Contributors</div>
                      <div className="font-medium text-primary">{pot.members?.length || 0} Members</div>
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
                      {(pot.members || []).map((member, index) => (
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
                          {(pot.recipients || []).includes(member) && pot.payoutStructure !== "one-to-many" && (
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
              
              {/* Show change request voting for active pots */}
              {pot.status !== 'completed' && (
                <div className="mt-4">
                  <ChangeRequestVoting potId={pot.id} />
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
                            // Process the actual withdrawal to Personal Pot
                            const withdrawalAmount = 200; // Example amount - in real app this would come from the request
                            const recipient = "Sarah"; // Example recipient - in real app this would come from the request
                            
                            const success = approveWithdrawalToPersonal(pot.id, withdrawalAmount, recipient);
                            if (success) {
                              toast({
                                title: "Withdrawal Approved",
                                description: `₡${withdrawalAmount} has been transferred to ${recipient}'s Personal Pot`,
                              });
                            } else {
                              toast({
                                title: "Error",
                                description: "Insufficient pot balance for this withdrawal",
                                variant: "destructive",
                              });
                            }
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

      {/* Withdrawal Amount Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw to your Personal Pot.
              {pot && pot.payoutStructure !== "many-to-one" && (
                <span className="block mt-2 text-sm text-amber-600">
                  This will trigger a vote among all pot members.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdrawAmount">Withdrawal Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₡</span>
                <Input
                  id="withdrawAmount"
                  type="number"
                  min="1"
                  max={pot?.currentBalance || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="pl-8"
                  placeholder="Enter amount"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum available: ₡{pot?.currentBalance || 0}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!pot || withdrawAmount <= 0 || withdrawAmount > pot.currentBalance) {
                    toast({
                      title: "Invalid Amount",
                      description: "Please enter a valid withdrawal amount",
                      variant: "destructive"
                    });
                    return;
                  }

                  // Process withdrawal request based on payout structure
                  if (pot.payoutStructure === "one-to-many" || pot.payoutStructure === "many-to-selected") {
                    toast({
                      title: "Vote Initiated",
                      description: `Withdrawal request for ₡${withdrawAmount} sent to all members for voting`,
                    });
                  }
                  
                  setShowWithdrawDialog(false);
                  setWithdrawAmount(0);
                }}
                disabled={!pot || withdrawAmount <= 0 || withdrawAmount > pot.currentBalance}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Change Dialog */}
      <Dialog open={showGoalChangeDialog} onOpenChange={setShowGoalChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Pot Goal</DialogTitle>
            <DialogDescription>
              {pot && pot.currentBalance >= pot.goalAmount 
                ? "Goal has been reached. This request must be submitted before payout withdrawal."
                : "Enter a new target goal for this pot. This will trigger a vote among all members."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newGoalAmount">New Target Goal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₡</span>
                <Input
                  id="newGoalAmount"
                  type="number"
                  min="1"
                  value={newGoalAmount}
                  onChange={(e) => setNewGoalAmount(Number(e.target.value))}
                  className="pl-8"
                  placeholder="Enter new goal"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current goal: ₡{pot?.goalAmount || 0} | Current balance: ₡{pot?.currentBalance || 0}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowGoalChangeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!pot || newGoalAmount <= 0) {
                    toast({
                      title: "Invalid Goal",
                      description: "Please enter a valid goal amount",
                      variant: "destructive"
                    });
                    return;
                  }

                  addChangeRequest({
                    id: generateId(),
                    potId: pot.id,
                    type: 'goal-change',
                    requestedBy: currentUser,
                    timestamp: new Date().toISOString(),
                    status: 'pending',
                    description: `Change pot goal from ₡${pot.goalAmount} to ₡${newGoalAmount}`,
                    votes: [],
                    voteThreshold: pot.voteThreshold || 75,
                    details: {
                      oldGoal: pot.goalAmount,
                      newGoal: newGoalAmount
                    }
                  });

                  toast({
                    title: "Goal Change Request",
                    description: `Request to change goal from ₡${pot.goalAmount} to ₡${newGoalAmount} sent to all members for voting`,
                  });
                  
                  setShowGoalChangeDialog(false);
                  setNewGoalAmount(0);
                }}
                disabled={!pot || newGoalAmount <= 0}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribution/Payout Change Dialog */}
      <Dialog open={showContributionPayoutDialog} onOpenChange={setShowContributionPayoutDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Contribution/Payout Structure</DialogTitle>
            <DialogDescription>
              Modify how members contribute and receive payouts for this pot. Changes will be sent to all members for voting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pot && (
              <>
                {/* Original Pot Settings Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Original Pot Settings</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Contribution Method:</strong> {
                      pot.contributionMethod === 'just-reach-goal' ? 'Just Reach Goal (members can deposit any amount)' :
                      pot.contributionMethod === 'equal-split' ? 'Equal Split' :
                      pot.contributionMethod === 'individual-contribution' ? 'Individual Contribution' :
                      'Just Reach Goal (default)'
                    }</p>
                    <p><strong>Payout Structure:</strong> {
                      pot.payoutStructure === 'one-to-many' ? 'One-to-Many' :
                      pot.payoutStructure === 'many-to-one' ? 'Many-to-One' :
                      'Many-to-Selected'
                    }</p>
                  </div>
                </div>

                <div className="bg-secondary rounded-lg p-4">
                  <h3 className="font-medium text-primary mb-3">Current Members</h3>
                  <div className="space-y-3">
                    {(pot.members || []).map((member) => (
                      <div key={member} className="flex items-center justify-between p-3 bg-background rounded">
                        <div className="flex items-center">
                          {member === pot.creator && <Crown className="w-4 h-4 text-amber-500 mr-2" />}
                          <span>{member}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          {/* Contribution Column */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Contribute:</Label>
                            {pot.contributionMethod === 'just-reach-goal' ? (
                              <Button
                                variant={tempMemberContributions[member] ? "default" : "outline"}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const newContributions = { ...tempMemberContributions };
                                  if (newContributions[member]) {
                                    delete newContributions[member];
                                  } else {
                                    newContributions[member] = 1; // Just mark as contributing
                                  }
                                  setTempMemberContributions(newContributions);
                                }}
                              >
                                {tempMemberContributions[member] ? "✓" : "○"}
                              </Button>
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                value={tempMemberContributions[member] || 0}
                                onChange={(e) => setTempMemberContributions({
                                  ...tempMemberContributions,
                                  [member]: Number(e.target.value)
                                })}
                                className="w-20 h-8 text-xs"
                              />
                            )}
                          </div>
                          
                          {/* Payout Column */}
                          <div className="flex items-center space-x-2">
                            <Label className="text-xs">Payout:</Label>
                            {pot.payoutStructure === 'one-to-many' ? (
                              <span className="text-xs text-muted-foreground">Auto (receives share)</span>
                            ) : pot.payoutStructure === 'many-to-one' ? (
                              <Button
                                variant={(pot.recipients || []).includes(member) ? "default" : "outline"}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  // For many-to-one, only one member can be selected
                                  const newPayouts = { [member]: 1 };
                                  setTempMemberPayouts(newPayouts);
                                }}
                              >
                                {(pot.recipients || []).includes(member) ? "✓" : "○"}
                              </Button>
                            ) : (
                              // many-to-selected
                              <Button
                                variant={tempMemberPayouts[member] ? "default" : "outline"}
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const newPayouts = { ...tempMemberPayouts };
                                  if (newPayouts[member]) {
                                    delete newPayouts[member];
                                  } else {
                                    newPayouts[member] = 1; // Just mark as recipient
                                  }
                                  setTempMemberPayouts(newPayouts);
                                }}
                              >
                                {tempMemberPayouts[member] ? "✓" : "○"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Just Reach Goal Notice */}
                  {pot.contributionMethod === 'just-reach-goal' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                      <p className="text-sm text-amber-700">
                        <strong>Note:</strong> This pot uses "Just Reach Goal" contribution method. 
                        Click the ○/✓ icons to select who contributes and who receives payouts. 
                        Members can deposit any amount towards the goal.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Vote/Approval Method */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Request Approval Method</Label>
              <RadioGroup value={voteAdmission} onValueChange={setVoteAdmission} className="mt-2">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2 p-3 border rounded">
                    <RadioGroupItem value="democratic" id="democratic" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="democratic" className="font-medium">Democratic Vote</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        All pot members receive a request to approve/deny this change. Majority vote determines the outcome.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 p-3 border rounded">
                    <RadioGroupItem value="admin" id="admin" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="admin" className="font-medium">Admin Approval</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        All members receive a notification of your request, but only the Admin needs to approve/deny.
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowContributionPayoutDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (!pot) return;
                
                const approvalMethod = voteAdmission === "democratic" ? "democratic vote" : "admin approval";
                
                addChangeRequest({
                  id: generateId(),
                  potId: pot.id,
                  type: 'contribution-payout-change',
                  requestedBy: currentUser,
                  timestamp: new Date().toISOString(),
                  status: 'pending',
                  description: `Change contribution/payout structure for this pot`,
                  votes: [],
                  voteThreshold: pot.voteThreshold || 75,
                  approvalMode: voteAdmission as 'democratic' | 'admin',
                  details: {
                    newContributions: { ...tempMemberContributions },
                    newPayouts: { ...tempMemberPayouts }
                  }
                });
                
                toast({
                  title: "Contribution/Payout Change Request",
                  description: `Request sent for ${approvalMethod}`,
                });
                setShowContributionPayoutDialog(false);
                setTempMemberContributions({});
                setTempMemberPayouts({});
              }}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Role Change Dialog */}
      <Dialog open={showAdminChangeDialog} onOpenChange={setShowAdminChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Admin Role</DialogTitle>
            <DialogDescription>
              Select a new member to become the admin of this pot. This will be sent to all members for voting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pot && (
              <RadioGroup value={selectedNewAdmin} onValueChange={setSelectedNewAdmin}>
                <div className="space-y-2">
                  {(pot.members || []).filter(member => member !== pot.creator).map((member) => (
                    <div key={member} className="flex items-center space-x-2 p-2 rounded border">
                      <RadioGroupItem value={member} id={member} />
                      <Label htmlFor={member} className="flex-1">{member}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAdminChangeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!selectedNewAdmin || !pot) {
                    toast({
                      title: "No Selection",
                      description: "Please select a new admin",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  addChangeRequest({
                    id: generateId(),
                    potId: pot.id,
                    type: 'admin-change',
                    requestedBy: currentUser,
                    timestamp: new Date().toISOString(),
                    status: 'pending',
                    description: `Change pot admin from ${pot.creator} to ${selectedNewAdmin}`,
                    votes: [],
                    voteThreshold: pot.voteThreshold || 75,
                    details: {
                      newAdmin: selectedNewAdmin
                    }
                  });
                  
                  toast({
                    title: "Admin Change Request",
                    description: `Request to make ${selectedNewAdmin} the new admin sent to all members for voting`,
                  });
                  setShowAdminChangeDialog(false);
                  setSelectedNewAdmin("");
                }}
                disabled={!selectedNewAdmin}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Management Dialog */}
      <Dialog open={showMemberManagementDialog} onOpenChange={setShowMemberManagementDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add/Remove Members</DialogTitle>
            <DialogDescription>
              Add new members or remove existing ones. Changes will be sent to all members for voting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Remove Member</Label>
              {pot && (
                <RadioGroup value={memberToRemove} onValueChange={setMemberToRemove}>
                  <div className="space-y-2 mt-2">
                    {(pot.members || []).filter(member => member !== pot.creator).map((member) => (
                      <div key={member} className="flex items-center space-x-2 p-2 rounded border">
                        <RadioGroupItem value={member} id={`remove-${member}`} />
                        <Label htmlFor={`remove-${member}`} className="flex-1">{member}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
            </div>
            
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Add New Member</Label>
              <div className="mt-2 space-y-2">
                <Input
                  value={newMemberInput}
                  onChange={(e) => setNewMemberInput(e.target.value)}
                  placeholder="Enter email or contact"
                  className="w-full"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      Recent Members
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2">
                    <div className="space-y-1">
                      {["john@example.com", "sarah@example.com", "mike@example.com"].map((contact) => (
                        <Button
                          key={contact}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => setNewMemberInput(contact)}
                        >
                          {contact}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowMemberManagementDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!memberToRemove && !newMemberInput.trim()) {
                    toast({
                      title: "No Changes",
                      description: "Please select a member to remove or add a new member",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  let description = "";
                  if (memberToRemove && newMemberInput.trim()) {
                    description = `Request to remove ${memberToRemove} and add ${newMemberInput} sent to all members for voting`;
                  } else if (memberToRemove) {
                    description = `Request to remove ${memberToRemove} sent to all members for voting`;
                  } else {
                    description = `Request to add ${newMemberInput} sent to all members for voting`;
                  }
                  
                  toast({
                    title: "Member Management Request",
                    description: description,
                  });
                  setShowMemberManagementDialog(false);
                }}
                disabled={!memberToRemove && !newMemberInput.trim()}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clean The Pot Early Dialog */}
      <Dialog open={showCleanPotDialog} onOpenChange={setShowCleanPotDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clean The Pot Early</DialogTitle>
            <DialogDescription>
              End this pot early and distribute funds. A 5% fee will be deducted from the current balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {pot && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                    <h3 className="font-medium text-amber-800">Fee Information</h3>
                  </div>
                  <div className="space-y-1 text-sm text-amber-700">
                    <p>Current Balance: ₡{pot.currentBalance}</p>
                    <p>5% Fee: ₡{(pot.currentBalance * 0.05).toFixed(2)}</p>
                    <p className="font-medium">Available for Payout: ₡{(pot.currentBalance * 0.95).toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="bg-secondary rounded-lg p-4">
                  <h3 className="font-medium text-primary mb-3">Distribute Payout Among Members</h3>
                  <div className="space-y-3">
                    {(pot.members || []).map((member) => (
                      <div key={member} className="flex items-center justify-between p-3 bg-background rounded">
                        <div className="flex items-center">
                          {member === pot.creator && <Crown className="w-4 h-4 text-amber-500 mr-2" />}
                          <span>{member}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label className="text-xs">Payout Amount:</Label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₡</span>
                            <Input
                              type="number"
                              min="0"
                              max={pot.currentBalance * 0.95}
                              value={tempMemberPayouts[member] || 0}
                              onChange={(e) => setTempMemberPayouts({
                                ...tempMemberPayouts,
                                [member]: Number(e.target.value)
                              })}
                              className="w-24 h-8 text-xs pl-6"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total to distribute: ₡{Object.values(tempMemberPayouts).reduce((sum, amount) => sum + amount, 0).toFixed(2)} / ₡{(pot.currentBalance * 0.95).toFixed(2)}
                  </p>
                </div>
              </>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCleanPotDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!pot) return;
                  
                  const totalPayout = Object.values(tempMemberPayouts).reduce((sum, amount) => sum + amount, 0);
                  const maxPayout = pot.currentBalance * 0.95;
                  
                  if (totalPayout > maxPayout) {
                    toast({
                      title: "Payout Exceeds Available",
                      description: `Total payout (₡${totalPayout.toFixed(2)}) exceeds available amount (₡${maxPayout.toFixed(2)})`,
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  addChangeRequest({
                    id: generateId(),
                    potId: pot.id,
                    type: 'clean-pot',
                    requestedBy: currentUser,
                    timestamp: new Date().toISOString(),
                    status: 'pending',
                    description: `Clean pot early and distribute ₡${totalPayout.toFixed(2)} among members`,
                    votes: [],
                    voteThreshold: pot.voteThreshold || 75,
                    details: {
                      cleanPotPayouts: { ...tempMemberPayouts }
                    }
                  });
                  
                  toast({
                    title: "Clean Pot Early Request",
                    description: `Request to clean pot early with new payout distribution sent to all members for voting`,
                  });
                  setShowCleanPotDialog(false);
                  setTempMemberPayouts({});
                }}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Milestone Celebration Modal */}
      {currentMilestone && (
        <MilestoneCelebration
          isOpen={showMilestoneCelebration}
          onClose={() => {
            setShowMilestoneCelebration(false);
            setCurrentMilestone(null);
          }}
          milestone={currentMilestone}
        />
      )}

      {/* Pot Invite System */}
      {pot && (
        <PotInviteSystem
          pot={pot}
          isOpen={showInviteSystem}
          onClose={() => setShowInviteSystem(false)}
        />
      )}

      {/* Reuse Saved Pot Dialog */}
      <Dialog open={showReuseDialog} onOpenChange={setShowReuseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reuse Pot: {selectedSavedPot?.name}</DialogTitle>
            <DialogDescription>
              Would you like to reuse this pot with the same details or edit them first?
            </DialogDescription>
          </DialogHeader>
          
          {selectedSavedPot && (
            <div className="space-y-4">
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-foreground">Goal Amount:</span>
                  <span className="text-sm font-medium text-primary">₡ {selectedSavedPot.goalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-foreground">Payout Structure:</span>
                  <span className="text-sm font-medium text-primary">
                    {selectedSavedPot.payoutStructure === "one-to-many" ? "One-to-Many" : 
                     selectedSavedPot.payoutStructure === "many-to-one" ? "Many-to-One" : "Many-to-Selected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-foreground">Members:</span>
                  <span className="text-sm font-medium text-primary">{selectedSavedPot.members?.length || 0} members</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-[#B8E986] text-secondary font-bold hover:bg-[#A8D976]"
                  onClick={() => {
                    // Create a new pot with the same details
                    const newPot: PotType = {
                      ...selectedSavedPot,
                      id: generateId(),
                      currentBalance: 0,
                      status: 'active',
                      createdAt: new Date().toISOString(),
                      completedDate: undefined
                    };
                    
                    addPot(newPot);
                    setShowReuseDialog(false);
                    setSelectedTab("active");
                    
                    toast({
                      title: "Pot Reused!",
                      description: `${newPot.name} has been added to your active pots with the same members and settings.`,
                    });
                  }}
                >
                  Reuse Same Details
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // Navigate to create page with pre-filled data
                    // For now, we'll just create the pot and let them edit it manually
                    // In a real app, you'd navigate to a create/edit page with the data
                    const newPot: PotType = {
                      ...selectedSavedPot,
                      id: generateId(),
                      currentBalance: 0,
                      status: 'active',
                      createdAt: new Date().toISOString(),
                      completedDate: undefined
                    };
                    
                    addPot(newPot);
                    setShowReuseDialog(false);
                    setSelectedTab("active");
                    
                    toast({
                      title: "Pot Created!",
                      description: `${newPot.name} has been created. You can now edit it in the pot details.`,
                    });
                  }}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stripe Payment & Payout Modals */}
      {pot && (
        <>
          <StripePaymentModal
            isOpen={showStripeModal}
            onClose={() => setShowStripeModal(false)}
            pot={pot}
          />
          <PayoutDistributionModal
            isOpen={showPayoutModal}
            onClose={() => setShowPayoutModal(false)}
            pot={pot}
          />
        </>
      )}
    </div>
  );
}
