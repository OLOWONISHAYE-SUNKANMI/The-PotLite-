import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { useLocation } from "wouter";
import ErrorSimulationHandler from "@/components/ErrorSimulationHandler";
import { FaCrown, FaUserFriends, FaHandHoldingUsd, FaExclamationCircle, FaBan, FaClock, FaUserSlash, FaRedo, FaMagic, FaVoteYea, FaMoneyBillWave } from "react-icons/fa";

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
                  onClick={() => setLocation('/recipient-demo')}
                >
                  <FaMoneyBillWave className="mr-2" /> Recipient Role Demo
                </Button>
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
            Use these controls to simulate error states for testing. When toggled, these errors will affect the application behavior.
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                className={`bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold ${simulateErrors.depositFailure ? 'border-2 border-destructive' : ''}`}
                onClick={toggleSimulateDepositFailure}
              >
                <FaExclamationCircle className="mr-2" /> Simulate Deposit Failure
              </Button>
              <Button 
                className={`bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold ${simulateErrors.withdrawalRejection ? 'border-2 border-destructive' : ''}`}
                onClick={toggleSimulateWithdrawalRejection}
              >
                <FaBan className="mr-2" /> Simulate Withdrawal Rejection
              </Button>
              <Button 
                className={`bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold ${simulateErrors.timeLock ? 'border-2 border-destructive' : ''}`}
                onClick={toggleSimulateTimeLock}
              >
                <FaClock className="mr-2" /> Simulate Time Lock Error
              </Button>
              <Button 
                className={`bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold ${simulateErrors.invalidRecipient ? 'border-2 border-destructive' : ''}`}
                onClick={toggleSimulateInvalidRecipient}
              >
                <FaUserSlash className="mr-2" /> Simulate Invalid Recipient
              </Button>
            </div>
            
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
