import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";
import { useToast } from "@/hooks/use-toast";

type DepositSimProps = {
  potId: string;
};

export default function DepositSim({ potId }: DepositSimProps) {
  const [amount, setAmount] = useState<number>(10);
  const [isAnimating, setIsAnimating] = useState(false);
  const coinContainerRef = useRef<HTMLDivElement>(null);
  
  const { addTransaction, updatePotBalance, simulateErrors } = usePot();
  const { currentUser } = useDummyUser();
  const { toast } = useToast();
  
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
        user: currentUser,
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
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Make a Deposit</h2>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="w-full md:w-2/3 mb-4 md:mb-0 md:mr-4">
            <Label className="block text-secondary-foreground text-sm mb-2">Amount (₡)</Label>
            <Input 
              type="number" 
              min="1" 
              max="100" 
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="bg-secondary border border-primary text-secondary-foreground"
            />
          </div>
          <Button 
            onClick={handleDeposit}
            disabled={isAnimating}
            className="w-full md:w-1/3 btn-gradient"
          >
            Deposit Coins
          </Button>
        </div>
        
        {/* Animated coin container */}
        <div 
          ref={coinContainerRef}
          className="h-24 mt-4 relative flex justify-center items-center overflow-hidden"
        ></div>
      </CardContent>
    </Card>
  );
}
