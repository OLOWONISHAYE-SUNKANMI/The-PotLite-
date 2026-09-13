import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { useLocation } from "wouter";
import ErrorSimulationHandler from "@/components/ErrorSimulationHandler";
import MilestoneCelebration from "@/components/MilestoneCelebration";
import { FaCrown, FaUserFriends, FaHandHoldingUsd, FaExclamationCircle, FaBan, FaClock, FaUserSlash, FaRedo, FaMagic, FaVoteYea, FaMoneyBillWave } from "react-icons/fa";
import { Building2, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, FileText, Landmark, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminPanel() {
  const { 
    resetAllData, 
    generateRandomScenario, 
    simulateErrors, 
    toggleSimulateDepositFailure, 
    toggleSimulateWithdrawalRejection, 
    toggleSimulateTimeLock, 
    toggleSimulateInvalidRecipient,
    toggleLiveMode,
    liveMode
  } = usePot();
  
  const { setUserRole } = useDummyUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [expandedExample, setExpandedExample] = useState<string | null>(null);

  // Unit Sandbox Simulation & Reconciliation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [recSummary, setRecSummary] = useState<any>(null);
  const [providerTxs, setProviderTxs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/provider-transactions")
      .then((res) => res.json())
      .then((data) => setProviderTxs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSimulateAction = async (action: string) => {
    setIsSimulating(true);
    setSimMessage(null);
    try {
      const res = await fetch("/api/admin/unit/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, accountId: "22170443", amount: 10000 }),
      });
      const data = await res.json();
      setSimMessage(`Success: ${action} triggered. Result: ${JSON.stringify(data.result?.attributes || data.result?.status || data.status)}`);
      toast({
        title: "Simulation Executed",
        description: `Action ${action} succeeded on Unit Sandbox.`,
      });
    } catch (err: any) {
      toast({
        title: "Simulation Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch("/api/admin/reconciliation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "all" }),
      });
      const data = await res.json();
      setRecSummary(data);

      // Refresh provider transactions
      fetch("/api/admin/provider-transactions")
        .then((r) => r.json())
        .then((txs) => setProviderTxs(Array.isArray(txs) ? txs : []));

      toast({
        title: "Reconciliation Complete",
        description: `Audited ${data.totalChecked} transactions. ${data.matchedCount} matched, ${data.discrepancyCount} discrepancies.`,
      });
    } catch (err: any) {
      toast({
        title: "Reconciliation Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsReconciling(false);
    }
  };
  
  // Track scroll to bottom for checklist completion
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if user has scrolled to bottom (within 50px)
      if (scrollTop + windowHeight >= documentHeight - 50 && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
        
        // Store in localStorage to mark checklist item as complete
        localStorage.setItem('thePot_exploreAdminPanelComplete', 'true');
        
        toast({
          title: "Admin Panel Explored!",
          description: "You've successfully explored all admin features and recipient role examples.",
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolledToBottom, toast]);
  
  // Handle role selection
  const handleRoleChange = (role: "admin" | "voter" | "recipient") => {
    setUserRole(role);
    
    toast({
      title: "Role Changed",
      description: `You are now simulating the ${role} role.`
    });
  };
  
  // Reset all data
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all test data? This action cannot be undone.")) {
      resetAllData();
      
      toast({
        title: "Data Reset",
        description: "All test data has been reset to default values."
      });
    }
  };
  
  // Generate random scenario
  const handleGenerateScenario = () => {
    generateRandomScenario();
    
    toast({
      title: "Random Scenario Generated",
      description: "A new random test scenario has been created."
    });
  };
  
  return (
    <div className="slide-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
        <p className="text-secondary-foreground">Testing tools for sandbox simulation</p>
      </div>
      
      {/* User Role Simulation */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Simulate User Role</h2>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button 
                className="bg-secondary hover:bg-secondary/80 border-2 border-primary text-primary font-bold w-full md:w-1/3"
                onClick={() => handleRoleChange("admin")}
              >
                <FaCrown className="mr-2" /> Admin Role
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium text-primary mb-3">Role Demo Pages</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Experience interactive demos that simulate the specific interfaces and actions available to different roles:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className="border-2 border-secondary"
                  onClick={() => setLocation('/voter-demo')}
                >
                  <FaVoteYea className="mr-2" /> Voter Role Demo
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-secondary"
                  onClick={() => handleRoleChange("recipient")}
                >
                  <FaMoneyBillWave className="mr-2" /> Recipient Role Demo
                </Button>
              </div>
              
              {/* Recipient Payout Structure Examples */}
              <div className="mt-6 p-4 bg-secondary/20 rounded-lg">
                <h3 className="text-lg font-medium text-primary mb-3">Recipient Invitation Examples</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  See how recipients receive invitations for different payout structures:
                </p>
                
                <div className="space-y-4">
                  {/* One-to-Many Example */}
                  <div 
                    className="p-4 bg-background border rounded-lg cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setExpandedExample(expandedExample === 'one-to-many' ? null : 'one-to-many')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-primary">🎁 Birthday Gift Collection</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">One-to-Many</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      You've been selected as a recipient for Emma's birthday gift fund!
                    </p>
                    <div className="flex justify-between text-xs">
                      <span>Goal: ₡200</span>
                      <span className="text-green-600">✓ Goal Reached</span>
                    </div>
                    
                    {expandedExample === 'one-to-many' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg space-y-6">
                          {/* Pot Description */}
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                            <h6 className="font-medium text-blue-900 mb-2">Pot Description</h6>
                            <p className="text-blue-800 text-sm italic">
                              "We're collecting funds to celebrate Sarah's birthday with a surprise party and gifts. 
                              Sarah has been such an amazing friend to all of us, and we want to make her day special!"
                            </p>
                          </div>
                          
                          {/* Recipient Details */}
                          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-5 border border-green-200">
                            <h5 className="font-semibold text-green-900 mb-4 flex items-center text-lg">
                              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                              Your Recipient Status
                            </h5>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-green-700 font-medium">Payout Structure</p>
                                  <p className="text-green-900 font-semibold">One-to-Many</p>
                                </div>
                                <div>
                                  <p className="text-green-700 font-medium">Your Role</p>
                                  <p className="text-green-900 font-semibold">Sole Recipient 🎁</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-green-700 font-medium">Contributors</p>
                                  <p className="text-green-900 font-semibold">Sarah, Mike, Alex, Jessica, David</p>
                                </div>
                                <div>
                                  <p className="text-green-700 font-medium">Withdrawal Method</p>
                                  <p className="text-green-900 font-semibold">Admin Approval</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status */}
                          <div className="bg-gradient-to-r from-green-100 to-green-50 border border-green-300 rounded-lg p-5">
                            <div className="flex items-center mb-3">
                              <span className="text-green-600 mr-3 text-xl">✅</span>
                              <h6 className="font-semibold text-green-800 text-lg">Ready for Payout</h6>
                            </div>
                            <p className="text-green-700 leading-relaxed">
                              Congratulations! The birthday gift fund has reached its ₡200 goal. The admin can now 
                              initiate the payout process. You'll receive the full amount directly to your Personal Pot 
                              within the app, ready for use however you'd like!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Many-to-One Example */}
                  <div 
                    className="p-4 bg-background border rounded-lg cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setExpandedExample(expandedExample === 'many-to-one' ? null : 'many-to-one')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-primary">🏠 House Down Payment</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Many-to-One</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your family is pooling funds to help with your house down payment.
                    </p>
                    <div className="flex justify-between text-xs">
                      <span>Goal: ₡5000</span>
                      <span className="text-orange-600">₡3200 / ₡5000 (64%)</span>
                    </div>
                    
                    {expandedExample === 'many-to-one' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg space-y-6">
                          {/* Pot Description */}
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                            <h6 className="font-medium text-blue-900 mb-2">Pot Description</h6>
                            <p className="text-blue-800 text-sm italic">
                              "Our family is saving together for a down payment on our first house. Everyone is contributing 
                              what they can to help us achieve this important milestone and start building our future together."
                            </p>
                          </div>
                          
                          {/* Recipient Details */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-5 border border-blue-200">
                            <h5 className="font-semibold text-blue-900 mb-4 flex items-center text-lg">
                              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                              Your Recipient Status
                            </h5>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-blue-700 font-medium">Payout Structure</p>
                                  <p className="text-blue-900 font-semibold">Many-to-One</p>
                                </div>
                                <div>
                                  <p className="text-blue-700 font-medium">Your Role</p>
                                  <p className="text-blue-900 font-semibold">Primary Recipient 🏠</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-blue-700 font-medium">Contributors</p>
                                  <p className="text-blue-900 font-semibold">Mom, Dad, Brother, Sister, Grandparents</p>
                                </div>
                                <div>
                                  <p className="text-blue-700 font-medium">Withdrawal Method</p>
                                  <p className="text-blue-900 font-semibold">Timed Release</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Status */}
                          <div className="bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-300 rounded-lg p-5">
                            <div className="flex items-center mb-3">
                              <span className="text-orange-600 mr-3 text-xl">⏳</span>
                              <h6 className="font-semibold text-orange-800 text-lg">In Progress</h6>
                            </div>
                            <p className="text-orange-700 mb-4 leading-relaxed">
                              Your family house fund is making great progress! ₡1800 still needed to reach the ₡5000 goal.
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm font-medium text-orange-800">
                                <span>Progress: ₡3200 / ₡5000</span>
                                <span>64%</span>
                              </div>
                              <div className="w-full bg-orange-200 rounded-full h-3">
                                <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full shadow-sm" style={{width: '64%'}}></div>
                              </div>
                              <p className="text-sm text-orange-600 mt-3">
                                Once the goal is reached, funds will automatically become available for withdrawal to help with your house purchase!
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Many-to-Selected Example */}
                  <div 
                    className="p-4 bg-background border rounded-lg cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setExpandedExample(expandedExample === 'many-to-selected' ? null : 'many-to-selected')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-primary">🎓 Scholarship Fund</h4>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Many-to-Selected</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      You're one of 3 selected recipients for the community scholarship fund.
                    </p>
                    <div className="flex justify-between text-xs">
                      <span>Total Fund: ₡1500</span>
                      <span className="text-green-600">Ready for Distribution</span>
                    </div>
                    
                    {expandedExample === 'many-to-selected' && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg space-y-6">
                          {/* Pot Description */}
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                            <h6 className="font-medium text-blue-900 mb-2">Pot Description</h6>
                            <p className="text-blue-800 text-sm italic">
                              "Our community scholarship fund supports outstanding students who demonstrate academic excellence 
                              and financial need. This year we're awarding scholarships to three deserving students to help 
                              with their educational expenses."
                            </p>
                          </div>
                          
                          {/* Recipient Details */}
                          <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg p-5 border border-purple-200">
                            <h5 className="font-semibold text-purple-900 mb-4 flex items-center text-lg">
                              <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                              Your Recipient Status
                            </h5>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-purple-700 font-medium">Payout Structure</p>
                                  <p className="text-purple-900 font-semibold">Many-to-Selected</p>
                                </div>
                                <div>
                                  <p className="text-purple-700 font-medium">Your Role</p>
                                  <p className="text-purple-900 font-semibold">1 of 3 Recipients 🎓</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-purple-700 font-medium">Contributors</p>
                                  <p className="text-purple-900 font-semibold">12 Community Members</p>
                                </div>
                                <div>
                                  <p className="text-purple-700 font-medium">Your Share</p>
                                  <p className="text-purple-900 font-semibold">₡500</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Voting Status */}
                          <div className="bg-gradient-to-r from-purple-100 to-violet-50 border border-purple-300 rounded-lg p-5">
                            <div className="flex items-center mb-3">
                              <span className="text-purple-600 mr-3 text-xl">🗳️</span>
                              <h6 className="font-semibold text-purple-800 text-lg">Vote Pending</h6>
                            </div>
                            <p className="text-purple-700 mb-4 leading-relaxed">
                              The community is currently voting on the scholarship fund distribution. You're one of three 
                              selected recipients for this year's awards!
                            </p>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-purple-600 font-medium">Other Recipients</p>
                                  <p className="text-purple-800">Maria Santos, James Chen</p>
                                </div>
                                <div>
                                  <p className="text-purple-600 font-medium">Distribution</p>
                                  <p className="text-purple-800">₡500 each (equal split)</p>
                                </div>
                              </div>
                              <p className="text-sm text-purple-600 mt-3">
                                Once the vote passes, you'll receive ₡500 directly to your Personal Pot to help with your educational expenses.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Error Simulation */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Error Simulation</h2>
          <p className="text-muted-foreground mb-4">
            Click on any error type below to see how it would appear to users. These simulations show what users experience when encountering errors.
          </p>
          
          <div className="space-y-4">
            {/* Error Simulation Visual Preview */}
            <ErrorSimulationHandler />
          </div>
        </CardContent>
      </Card>
      
      {/* Live Mode Preview */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Preview Mode</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-primary">Live Mode Preview</h3>
              <p className="text-sm text-secondary-foreground">Simulate app behavior as if it's connected to real payment systems</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="live-mode"
                checked={liveMode}
                onCheckedChange={toggleLiveMode}
              />
              <Label htmlFor="live-mode" className="text-secondary-foreground">
                {liveMode ? "On" : "Off"}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Unit Financial Banking Sandbox & Reconciliation Console */}
      <Card className="mb-6 border-emerald-500/30 bg-card shadow-lg shadow-emerald-500/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  Unit Banking Infrastructure Console
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                    Primary Provider
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Org: The Pot Unlimited (ID: 11002) • Sandbox: api.s.unit.sh
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunReconciliation}
                disabled={isReconciling}
                className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              >
                {isReconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Run Reconciliation
              </Button>
            </div>
          </div>

          {/* Connected Unit Accounts Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
            <div className="bg-muted/40 p-3 rounded-lg border border-border">
              <span className="text-xs text-muted-foreground block">Deposit Checking Account</span>
              <span className="font-mono text-sm font-semibold block mt-0.5">22170443 (Checking)</span>
              <span className="text-[11px] text-muted-foreground">Routing: 812345678 • Status: Open</span>
            </div>
            <div className="bg-muted/40 p-3 rounded-lg border border-border">
              <span className="text-xs text-muted-foreground block">Bill-Pay Wallet Account</span>
              <span className="font-mono text-sm font-semibold block mt-0.5">22170444 (Wallet)</span>
              <span className="text-[11px] text-muted-foreground">Routing: 087621228 • Status: Open</span>
            </div>
            <div className="bg-muted/40 p-3 rounded-lg border border-border">
              <span className="text-xs text-muted-foreground block">Org Credit Loan Line</span>
              <span className="font-mono text-sm font-semibold text-emerald-600 block mt-0.5">$1,000,000.00 Limit</span>
              <span className="text-[11px] text-muted-foreground">Org GL: 22170438 / 22170441</span>
            </div>
          </div>

          {/* Sandbox Event Simulators */}
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-500" />
              Sandbox Event Simulators (Unit Simulation Rails)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isSimulating}
                onClick={() => handleSimulateAction("receive_payment")}
                className="text-xs justify-start h-9"
              >
                <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                Simulate Inbound ACH ($100)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isSimulating}
                onClick={() => handleSimulateAction("clear_ach")}
                className="text-xs justify-start h-9"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                Simulate ACH Cleared
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isSimulating}
                onClick={() => handleSimulateAction("return_ach")}
                className="text-xs justify-start h-9"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Simulate ACH Return (NSF)
              </Button>
            </div>

            {simMessage && (
              <div className="mt-3 p-2.5 bg-muted/60 border border-border rounded text-xs font-mono text-foreground break-all">
                {simMessage}
              </div>
            )}
          </div>

          {/* Reconciliation Audit Results */}
          {recSummary && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Audit & Reconciliation Summary
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(recSummary.runAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-muted/30 p-2 rounded border border-border">
                  <span className="text-muted-foreground block">Audited</span>
                  <span className="text-base font-bold">{recSummary.totalChecked}</span>
                </div>
                <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-2 rounded border border-emerald-500/20">
                  <span className="block">Matched</span>
                  <span className="text-base font-bold">{recSummary.matchedCount}</span>
                </div>
                <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-2 rounded border border-amber-500/20">
                  <span className="block">Discrepancies</span>
                  <span className="text-base font-bold">{recSummary.discrepancyCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Provider Transactions Log snippet */}
          {providerTxs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Recent Provider Transactions Log
              </h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {providerTxs.slice(0, 5).map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20 border border-border">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${tx.provider === 'unit' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {tx.provider}
                      </span>
                      <span className="font-mono text-muted-foreground">{tx.providerTransactionId}</span>
                      <span className="text-muted-foreground">• {tx.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">${((tx.amount || 0) / 100).toFixed(2)}</span>
                      <span className="text-emerald-600 text-[11px] font-medium uppercase">{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Data Management */}
      <Card>

        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Test Data Management</h2>
          <div className="space-y-4">
            <Button 
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold"
              onClick={handleReset}
            >
              <FaRedo className="mr-2" /> Reset All Test Data
            </Button>
            <Button 
              className="w-full btn-gradient"
              onClick={handleGenerateScenario}
            >
              <FaMagic className="mr-2" /> Generate Random Test Scenario
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
