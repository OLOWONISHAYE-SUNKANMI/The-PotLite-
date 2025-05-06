import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePot } from "@/context/PotContext";
import { useToast } from "@/hooks/use-toast";
import { FaLock, FaUnlock } from "react-icons/fa";

type TimedReleaseProps = {
  releaseDate: string;
  potId: string;
};

export default function TimedRelease({ releaseDate, potId }: TimedReleaseProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isReleased, setIsReleased] = useState(false);
  
  const { simulateErrors } = usePot();
  const { toast } = useToast();
  
  // Calculate time remaining
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(releaseDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsReleased(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [releaseDate]);
  
  const handleWithdraw = () => {
    if (!isReleased) {
      toast({
        title: "Funds Locked",
        description: "The funds are still time-locked and cannot be withdrawn yet.",
        variant: "destructive",
      });
      return;
    }
    
    if (simulateErrors.timeLock) {
      toast({
        title: "Time Lock Error",
        description: "There was an error verifying the time lock. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Withdrawal Successful",
      description: "The time lock has expired and funds have been withdrawn.",
    });
  };
  
  // Format time units to always show two digits
  const formatTimeUnit = (unit: number): string => {
    return unit.toString().padStart(2, '0');
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-primary mb-4">Time Lock</h2>
        <div className="bg-secondary rounded-lg p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
            <div>
              <h3 className="font-medium text-primary">
                {isReleased ? "Funds available now" : "Funds available in:"}
              </h3>
            </div>
            <div className="mt-2 md:mt-0">
              <span className="inline-block px-2 py-1 bg-background rounded text-xs text-secondary-foreground">
                {isReleased ? "Unlocked" : "Time Locked"}
              </span>
            </div>
          </div>
          
          {/* Countdown Timer */}
          {!isReleased && (
            <div className="flex justify-center py-4">
              <div className="grid grid-flow-col gap-5 text-center auto-cols-max">
                <div className="flex flex-col p-2 bg-background rounded-box text-secondary-foreground">
                  <span className="font-mono text-3xl">
                    {formatTimeUnit(timeLeft.days)}
                  </span>
                  days
                </div>
                <div className="flex flex-col p-2 bg-background rounded-box text-secondary-foreground">
                  <span className="font-mono text-3xl">
                    {formatTimeUnit(timeLeft.hours)}
                  </span>
                  hours
                </div>
                <div className="flex flex-col p-2 bg-background rounded-box text-secondary-foreground">
                  <span className="font-mono text-3xl">
                    {formatTimeUnit(timeLeft.minutes)}
                  </span>
                  min
                </div>
                <div className="flex flex-col p-2 bg-background rounded-box text-secondary-foreground">
                  <span className="font-mono text-3xl">
                    {formatTimeUnit(timeLeft.seconds)}
                  </span>
                  sec
                </div>
              </div>
            </div>
          )}
          
          {/* Withdraw button */}
          <div className="flex justify-center mt-3">
            {isReleased ? (
              <Button 
                className="bg-[#B8E986] text-secondary font-bold hover:bg-[#A8D976]"
                onClick={handleWithdraw}
              >
                <FaUnlock className="mr-2" /> Withdraw Funds
              </Button>
            ) : (
              <Button 
                className="bg-secondary border border-primary text-primary font-bold opacity-50 cursor-not-allowed"
                disabled
              >
                <FaLock className="mr-2" /> Withdraw Locked
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
