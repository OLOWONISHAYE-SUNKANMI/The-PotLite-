import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePot } from "@/context/PotContext";
import { 
  FaExclamationCircle, 
  FaBan, 
  FaClock, 
  FaUserSlash, 
  FaUndo, 
  FaWallet, 
  FaTimesCircle,
  FaLock
} from "react-icons/fa";

// Animation keyframes for errors
const shakeKeyframes = `
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-10px); }
  80% { transform: translateX(10px); }
  100% { transform: translateX(0); }
}
`;

type ErrorType = 'deposit' | 'withdrawal' | 'timelock' | 'recipient' | null;

// Add the keyframes to the document
const addKeyframesToDocument = () => {
  // Check if the keyframes are already added
  if (!document.getElementById('error-simulation-keyframes')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'error-simulation-keyframes';
    styleSheet.innerHTML = shakeKeyframes;
    document.head.appendChild(styleSheet);
  }
};

export default function ErrorSimulationHandler() {
  const { 
    simulateErrors, 
    toggleSimulateDepositFailure, 
    toggleSimulateWithdrawalRejection, 
    toggleSimulateTimeLock, 
    toggleSimulateInvalidRecipient 
  } = usePot();
  
  const [activeError, setActiveError] = useState<ErrorType>(null);
  const [countdown, setCountdown] = useState(180); // 3 minutes in seconds
  
  // Add keyframes when component mounts
  useEffect(() => {
    addKeyframesToDocument();
  }, []);
  
  // Handle error simulation
  const triggerError = (type: ErrorType) => {
    // Reset any active error first
    setActiveError(null);
    
    // Set timeout to ensure state update completes
    setTimeout(() => {
      setActiveError(type);
    
      if (type === 'deposit') {
        toggleSimulateDepositFailure();
        setTimeout(() => toggleSimulateDepositFailure(), 3000);
      } else if (type === 'withdrawal') {
        toggleSimulateWithdrawalRejection();
        setTimeout(() => toggleSimulateWithdrawalRejection(), 4000);
      } else if (type === 'timelock') {
        toggleSimulateTimeLock();
        setCountdown(180);
        setTimeout(() => toggleSimulateTimeLock(), 5000);
      } else if (type === 'recipient') {
        toggleSimulateInvalidRecipient();
        setTimeout(() => toggleSimulateInvalidRecipient(), 4000);
      }
    
      // Auto clear the visual error after a certain time
      setTimeout(() => {
        setActiveError(null);
      }, 5000);
    }, 50);
  };
  
  // Format countdown time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeError === 'timelock' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeError, countdown]);
  
  // Reset the active error
  const resetError = () => {
    if (activeError === 'deposit') toggleSimulateDepositFailure();
    else if (activeError === 'withdrawal') toggleSimulateWithdrawalRejection();
    else if (activeError === 'timelock') toggleSimulateTimeLock();
    else if (activeError === 'recipient') toggleSimulateInvalidRecipient();
    
    setActiveError(null);
  };
  
  return (
    <div className="mt-6 space-y-4">
      <h3 className="font-bold text-primary">Error Simulation Preview</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click on an error type to see how it would appear to users:
      </p>
      
      <div className="space-y-4">
        {activeError === 'deposit' && (
          <Alert className="bg-red-50 border-red-200 text-red-800 animate-[shake_0.5s_ease-in-out]">
            <FaExclamationCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-800">Deposit Failed</AlertTitle>
            <AlertDescription className="flex items-center gap-2 text-red-700">
              <FaWallet className="text-red-500" /> Insufficient balance or network issue detected.
              <Badge className="ml-auto" variant="outline">Error Code: DF-2304</Badge>
            </AlertDescription>
            <div className="mt-3">
              <Button size="sm" onClick={resetError} className="bg-red-100 text-red-800 hover:bg-red-200 border border-red-300">
                <FaUndo className="mr-2 h-3 w-3" /> Retry Deposit
              </Button>
            </div>
          </Alert>
        )}
        
        {activeError === 'withdrawal' && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <FaBan className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-800">Withdrawal Request Rejected</AlertTitle>
            <AlertDescription className="text-amber-700">
              <div className="flex items-center gap-2 mb-2">
                <FaTimesCircle /> Not approved by Admin or Vote failed.
              </div>
              <div className="bg-amber-100 p-2 rounded-md border border-amber-200 mt-2">
                <p className="text-sm font-medium">Rejection Reason:</p>
                <p className="text-sm">Vote threshold of 67% not met. Current vote: 42% (3/7 members)</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {activeError === 'timelock' && (
          <Alert className="bg-indigo-50 border-indigo-200 text-indigo-800">
            <FaClock className="h-4 w-4 text-indigo-500" />
            <AlertTitle className="text-indigo-800">Funds Temporarily Locked</AlertTitle>
            <AlertDescription className="text-indigo-700">
              <div className="mb-2">
                <FaLock className="inline-block mr-2" /> Withdrawal will be available in:
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-center font-mono text-xl font-bold text-indigo-600">
                  {formatTime(countdown)}
                </div>
                <Progress value={(countdown / 180) * 100} className="h-2 bg-indigo-200" />
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {activeError === 'recipient' && (
          <Alert className="bg-orange-50 border-orange-200 text-orange-800 animate-[shake_0.5s_ease-in-out]">
            <FaUserSlash className="h-4 w-4 text-orange-500" />
            <AlertTitle className="text-orange-800">Invalid Recipient</AlertTitle>
            <AlertDescription className="text-orange-700">
              <div className="mb-2">
                Selected recipient is not eligible for this Pot.
              </div>
              <div className="bg-orange-100 p-2 rounded-md border border-orange-200 mt-2">
                <p className="text-sm font-medium">Error Details:</p>
                <p className="text-sm">Recipient must be a registered member of this pot and have the required permissions.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {!activeError && (
          <div className="p-4 bg-muted rounded-lg border border-primary/10 text-center text-muted-foreground text-sm">
            No error simulation active. Click any button below to preview an error.
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            variant="outline"
            onClick={() => triggerError('deposit')}
            className={`${simulateErrors.depositFailure ? 'border-destructive text-destructive' : ''}`}
          >
            <FaExclamationCircle className="mr-2" /> Simulate Deposit Failure
          </Button>
          <Button 
            variant="outline"
            onClick={() => triggerError('withdrawal')}
            className={`${simulateErrors.withdrawalRejection ? 'border-amber-500 text-amber-600' : ''}`}
          >
            <FaBan className="mr-2" /> Simulate Withdrawal Rejection
          </Button>
          <Button 
            variant="outline"
            onClick={() => triggerError('timelock')}
            className={`${simulateErrors.timeLock ? 'border-indigo-500 text-indigo-600' : ''}`}
          >
            <FaClock className="mr-2" /> Simulate Time Lock Error
          </Button>
          <Button 
            variant="outline"
            onClick={() => triggerError('recipient')}
            className={`${simulateErrors.invalidRecipient ? 'border-orange-500 text-orange-600' : ''}`}
          >
            <FaUserSlash className="mr-2" /> Simulate Invalid Recipient
          </Button>
        </div>
      </div>
    </div>
  );
}