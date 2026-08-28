import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Sparkles } from "lucide-react";
import StripePaymentModal from "./StripePaymentModal";

type DepositSimProps = {
  potId: string;
};

export default function DepositSim({ potId }: DepositSimProps) {
  const [amount, setAmount] = useState<number>(10);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const coinContainerRef = useRef<HTMLDivElement>(null);
  
  const { pots, addTransaction, updatePotBalance, simulateErrors } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();

  const currentPot = pots.find((p) => p.id === potId) || {
    id: potId,
    name: `Pot #${potId}`,
    description: "",
    goalAmount: 500,
    currentBalance: 0,
    creator: "admin@thepot.com",
    createdBy: "1",
    payoutStructure: "many-to-one" as const,
    withdrawalMethod: "democratic" as const,
    members: [],
    recipients: [],
    createdAt: new Date().toISOString(),
  };
  
  const handleDeposit = () => {
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive amount",
        variant: "destructive",
      });
      return;
    }
    
    // Check if deposit should fail (error simulation)
    if (simulateErrors.depositFailure) {
      toast({
        title: "Deposit Failed",
        description: "The transaction could not be processed. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    // Start animation
    setIsAnimating(true);
    animateCoinDrop();
    
    // Complete transaction after animation
    setTimeout(() => {
      // Add transaction to history
      addTransaction({
        id: Math.random().toString(36).substring(2, 10),
        potId,
        type: "deposit",
        amount,
        user: currentUser || "Current User",
        timestamp: new Date().toISOString(),
        status: "completed"
      });
      
      // Update pot balance
      updatePotBalance(potId, amount);
      
      setIsAnimating(false);
      
      toast({
        title: "Deposit Successful",
        description: `You've deposited ₡ ${amount} into the pot.`,
      });
    }, 800);
  };
  
  const animateCoinDrop = () => {
    if (!coinContainerRef.current) return;
    
    // Create and animate coin
    const coin = document.createElement("div");
    coin.className = "absolute bg-accent w-12 h-12 rounded-full flex items-center justify-center text-secondary font-bold coin-drop";
    coin.textContent = "₡";
    
    // Random position horizontally
    const position = Math.floor(Math.random() * 80);
    coin.style.left = `${position}%`;
    
    coinContainerRef.current.appendChild(coin);
    
    // Remove coin after animation
    setTimeout(() => {
      coin.remove();
    }, 1500);
  };
  
  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-primary">Make a Deposit</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowStripeModal(true)}
              className="border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay with Stripe Card
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="w-full md:w-1/2">
              <Label className="block text-secondary-foreground text-sm mb-2">Amount (₡ / USD)</Label>
              <Input 
                type="number" 
                min="1" 
                max="1000" 
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="bg-secondary border border-primary text-secondary-foreground"
              />
            </div>
            <div className="w-full md:w-1/2 flex gap-2">
              <Button 
                onClick={handleDeposit}
                disabled={isAnimating}
                className="flex-1 bg-secondary border border-border hover:bg-secondary/80 text-foreground font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-accent" />
                Quick Sandbox Deposit
              </Button>
              <Button 
                onClick={() => setShowStripeModal(true)}
                className="flex-1 btn-gradient font-bold"
              >
                <CreditCard className="w-4 h-4 mr-1.5" />
                Pay with Stripe
              </Button>
            </div>
          </div>
          
          {/* Animated coin container */}
          <div 
            ref={coinContainerRef}
            className="h-16 mt-3 relative flex justify-center items-center overflow-hidden"
          ></div>
        </CardContent>
      </Card>

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        pot={currentPot}
      />
    </>
  );
}
