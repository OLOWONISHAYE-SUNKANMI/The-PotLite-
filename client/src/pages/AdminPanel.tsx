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
                  <div className="p-4 bg-background border rounded-lg">
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
                  </div>

                  {/* Many-to-One Example */}
                  <div className="p-4 bg-background border rounded-lg">
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
                  </div>

                  {/* Many-to-Selected Example */}
                  <div className="p-4 bg-background border rounded-lg">
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
