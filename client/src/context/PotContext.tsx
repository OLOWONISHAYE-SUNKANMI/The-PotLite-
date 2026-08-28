import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PotType, TransactionType, ChangeRequestType, generateId } from "@/lib/utils";

interface PotContextType {
  personalPot: {
    balance: number;
  };
  pots: PotType[];
  completedPots: PotType[];
  savedPots: PotType[];
  transactions: TransactionType[];
  changeRequests: ChangeRequestType[];
  feedback: any[];
  simulateErrors: {
    depositFailure: boolean;
    withdrawalRejection: boolean;
    timeLock: boolean;
    invalidRecipient: boolean;
  };
  liveMode: boolean;
  hasSeenOnboarding: boolean;
  addPot: (pot: PotType) => void;
  updatePot: (pot: PotType) => void;
  deletePot: (potId: string) => void;
  completePot: (potId: string) => void;
  savePot: (potId: string) => void;
  unsavePot: (potId: string) => void;
  addTransaction: (transaction: TransactionType) => void;
  addChangeRequest: (changeRequest: ChangeRequestType) => void;
  voteOnChangeRequest: (changeRequestId: string, user: string, approve: boolean) => void;
  updatePotBalance: (potId: string, amount: number) => void;
  updatePersonalPotBalance: (amount: number) => void;
  depositFromPersonalToPot: (potId: string, amount: number) => boolean;
  withdrawFromPotToPersonal: (potId: string, amount: number) => void;
  approveWithdrawalToPersonal: (potId: string, amount: number, recipient: string) => boolean;
  addFeedback: (feedback: any) => void;
  resetAllData: () => void;
  generateRandomScenario: () => void;
  toggleSimulateDepositFailure: () => void;
  toggleSimulateWithdrawalRejection: () => void;
  toggleSimulateTimeLock: () => void;
  toggleSimulateInvalidRecipient: () => void;
  toggleLiveMode: () => void;
  setHasSeenOnboarding: (value: boolean) => void;
}

const PotContext = createContext<PotContextType | undefined>(undefined);

// Default transaction data
const defaultTransactions: TransactionType[] = [
  {
    id: "tx1",
    potId: "pot1",
    type: "deposit",
    amount: 50,
    user: "Mike",
    description: "Initial deposit",
    timestamp: new Date().toISOString(),
    balanceAfter: 50,
    status: "completed"
  },
  {
    id: "tx2",
    potId: "pot1",
    type: "vote",
    user: "Alex",
    description: "Voted on withdrawal request",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    voteCount: 3,
    voteTotal: 6
  },
  {
    id: "tx3",
    potId: "pot1",
    type: "deposit",
    amount: 30,
    user: "Jessica",
    description: "Weekly contribution",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    balanceAfter: 80,
    status: "completed"
  },
  {
    id: "tx4",
    potId: "pot1",
    type: "request",
    amount: 200,
    user: "Sarah",
    description: "For booking hotel rooms",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: "pending"
  },
  {
    id: "tx5",
    potId: "pot1",
    type: "deposit",
    amount: 100,
    user: "John",
    description: "Monthly contribution",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    balanceAfter: 180,
    status: "completed"
  },
  {
    id: "tx6",
    potId: "pot1",
    type: "deposit",
    amount: 90,
    user: "Emma",
    description: "Trip savings",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    balanceAfter: 270,
    status: "completed"
  },
  {
    id: "tx7",
    potId: "pot1",
    type: "deposit",
    amount: 50,
    user: "David",
    description: "Initial deposit",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    balanceAfter: 320,
    status: "completed"
  }
];

// Default pot data
const defaultPots: PotType[] = [
  {
    id: "pot1",
    name: "Weekend Trip Fund",
    description: "Saving for our group weekend getaway",
    goalAmount: 500,
    currentBalance: 320,
    payoutStructure: "many-to-one",
    withdrawalMethod: "admin",
    creator: "Current User",
    createdBy: "Current User",
    members: ["Current User", "Mike", "Alex", "Jessica", "Sarah", "Emma", "David"],
    recipients: ["Sarah"],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    status: 'active'
  },
  {
    id: "pot2",
    name: "Birthday Gift",
    description: "Group gift for Emma's birthday",
    goalAmount: 200, 
    currentBalance: 0, // Already paid out
    payoutStructure: "many-to-one",
    withdrawalMethod: "democratic",
    voteThreshold: 75,
    creator: "Current User",
    createdBy: "Current User",
    members: ["Current User", "Mike", "Alex", "Jessica", "Sarah", "David"],
    recipients: ["Emma"],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    status: 'completed',
    completedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  }
];

interface PotProviderProps {
  children: ReactNode;
}

export const PotProvider = ({ children }: PotProviderProps) => {
  // Initialize state from localStorage or defaults
  const [personalPot, setPersonalPot] = useState(() => {
    const storedPersonalPot = localStorage.getItem("thePot_personalPot");
    return storedPersonalPot ? JSON.parse(storedPersonalPot) : { balance: 1000 }; // Default 1000 coins for demo
  });
  
  const [pots, setPots] = useState<PotType[]>(() => {
    const storedPots = localStorage.getItem("thePot_pots");
    const initialPots = storedPots ? JSON.parse(storedPots) : defaultPots;
    // Ensure all pots have a status (default to 'active')
    return initialPots.map((pot: PotType) => ({
      ...pot,
      status: pot.status || 'active'
    }));
  });
  
  const [transactions, setTransactions] = useState<TransactionType[]>(() => {
    const storedTransactions = localStorage.getItem("thePot_transactions");
    return storedTransactions ? JSON.parse(storedTransactions) : defaultTransactions;
  });
  
  const [feedback, setFeedback] = useState<any[]>(() => {
    const storedFeedback = localStorage.getItem("thePot_feedback");
    return storedFeedback ? JSON.parse(storedFeedback) : [];
  });
  
  const [savedPots, setSavedPots] = useState<PotType[]>(() => {
    const storedSavedPots = localStorage.getItem("thePot_savedPots");
    return storedSavedPots ? JSON.parse(storedSavedPots) : [];
  });

  const [changeRequests, setChangeRequests] = useState<ChangeRequestType[]>(() => {
    const storedChangeRequests = localStorage.getItem("thePot_changeRequests");
    return storedChangeRequests ? JSON.parse(storedChangeRequests) : [];
  });
  
  const [simulateErrors, setSimulateErrors] = useState({
    depositFailure: false,
    withdrawalRejection: false,
    timeLock: false,
    invalidRecipient: false
  });
  
  const [liveMode, setLiveMode] = useState(false);
  
  // Onboarding state
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem("hasSeenOnboarding") === "true" || pots.length > 0;
  });
  
  // Computed state - filter active and completed pots
  const activePots = pots.filter(pot => pot.status === 'active' || !pot.status);
  const completedPots = pots.filter(pot => pot.status === 'completed');
  
  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem("thePot_personalPot", JSON.stringify(personalPot));
  }, [personalPot]);
  
  useEffect(() => {
    localStorage.setItem("thePot_pots", JSON.stringify(pots));
  }, [pots]);
  
  useEffect(() => {
    localStorage.setItem("thePot_transactions", JSON.stringify(transactions));
  }, [transactions]);
  
  useEffect(() => {
    localStorage.setItem("thePot_feedback", JSON.stringify(feedback));
  }, [feedback]);
  
  useEffect(() => {
    localStorage.setItem("thePot_savedPots", JSON.stringify(savedPots));
  }, [savedPots]);

  useEffect(() => {
    localStorage.setItem("thePot_changeRequests", JSON.stringify(changeRequests));
  }, [changeRequests]);
  
  // Pot operations
  const addPot = (pot: PotType) => {
    setPots([...pots, pot]);
  };
  
  const updatePot = (updatedPot: PotType) => {
    setPots(pots.map(pot => pot.id === updatedPot.id ? updatedPot : pot));
  };
  
  const deletePot = (potId: string) => {
    setPots(pots.filter(pot => pot.id !== potId));
    // Also delete associated transactions
    setTransactions(transactions.filter(tx => tx.potId !== potId));
  };
  
  // Mark a pot as completed
  const completePot = (potId: string) => {
    setPots(pots.map(pot => {
      if (pot.id === potId) {
        // Add a completion transaction
        addTransaction({
          id: generateId(),
          potId,
          type: 'withdrawal',
          amount: pot.currentBalance,
          user: pot.recipients[0] || "Current User",
          description: "Final payout - pot completed",
          timestamp: new Date().toISOString(),
          status: "completed",
          balanceAfter: 0
        });
        
        // Mark the pot as completed and set the completion date
        return { 
          ...pot, 
          status: 'completed', 
          completedDate: new Date().toISOString(),
          currentBalance: 0 
        };
      }
      return pot;
    }));
  };
  
  // Save a pot for reuse
  const savePot = (potId: string) => {
    const potToSave = pots.find(p => p.id === potId);
    if (potToSave && !savedPots.find(p => p.id === potId)) {
      setSavedPots([...savedPots, potToSave]);
    }
  };
  
  // Remove a pot from saved pots
  const unsavePot = (potId: string) => {
    setSavedPots(savedPots.filter(p => p.id !== potId));
  };
  
  // Transaction operations
  const addTransaction = (transaction: TransactionType) => {
    setTransactions([transaction, ...transactions]);
  };

  // Change request operations
  const addChangeRequest = (changeRequest: ChangeRequestType) => {
    setChangeRequests([changeRequest, ...changeRequests]);
  };

  const voteOnChangeRequest = (changeRequestId: string, user: string, approve: boolean) => {
    setChangeRequests(changeRequests.map(cr => {
      if (cr.id === changeRequestId) {
        // Check if user already voted
        const existingVote = cr.votes.find(v => v.user === user);
        if (existingVote) {
          return cr; // Already voted
        }
        
        const newVotes = [...cr.votes, { user, approve }];
        const pot = pots.find(p => p.id === cr.potId);
        
        // Handle admin-only approval mode
        if (cr.approvalMode === 'admin') {
          // Only the admin's vote matters
          if (user === pot?.creator) {
            return { 
              ...cr, 
              votes: newVotes, 
              status: approve ? 'approved' as const : 'rejected' as const 
            };
          }
          // Non-admin votes are recorded but don't affect status
          return { ...cr, votes: newVotes };
        }
        
        // Democratic voting logic
        const totalMembers = pot?.members.length || 1;
        const approvalVotes = newVotes.filter(v => v.approve).length;
        const approvalPercentage = Math.round((approvalVotes / totalMembers) * 100);
        
        // Check if threshold is met
        if (approvalPercentage >= cr.voteThreshold) {
          return { ...cr, votes: newVotes, status: 'approved' as const };
        }
        
        // Check if rejection is guaranteed (remaining votes can't reach threshold)
        const remainingVotes = totalMembers - newVotes.length;
        const maxPossibleApproval = ((approvalVotes + remainingVotes) / totalMembers) * 100;
        if (maxPossibleApproval < cr.voteThreshold) {
          return { ...cr, votes: newVotes, status: 'rejected' as const };
        }
        
        return { ...cr, votes: newVotes };
      }
      return cr;
    }));
  };
  
  // Update pot balance
  const updatePotBalance = (potId: string, amount: number) => {
    setPots(pots.map(pot => {
      if (pot.id === potId) {
        const newBalance = pot.currentBalance + amount;
        return { ...pot, currentBalance: newBalance };
      }
      return pot;
    }));
  };
  
  // Personal pot operations
  const updatePersonalPotBalance = (amount: number) => {
    setPersonalPot((prev: { balance: number }) => ({
      ...prev,
      balance: prev.balance + amount
    }));
    
    // Add a transaction record if needed
    addTransaction({
      id: generateId(),
      potId: 'personal',
      type: amount > 0 ? 'deposit' : 'withdrawal',
      amount: Math.abs(amount),
      user: "Current User",
      description: amount > 0 ? "Added to personal pot" : "Withdrew from personal pot",
      timestamp: new Date().toISOString(),
      balanceAfter: personalPot.balance + amount,
      status: "completed"
    });
  };
  
  // Transfer from personal pot to a group pot
  const depositFromPersonalToPot = (potId: string, amount: number) => {
    // First check if there's enough in personal pot
    if (personalPot.balance < amount) {
      return false;
    }
    
    // Deduct from personal pot
    setPersonalPot((prev: { balance: number }) => ({
      ...prev,
      balance: prev.balance - amount
    }));
    
    // Add to group pot
    updatePotBalance(potId, amount);
    
    // Add a transaction record
    addTransaction({
      id: generateId(),
      potId,
      type: 'deposit',
      amount,
      user: "Current User",
      description: "Transferred from personal pot",
      timestamp: new Date().toISOString(),
      balanceAfter: pots.find(p => p.id === potId)!.currentBalance + amount,
      status: "completed"
    });
    
    return true;
  };
  
  // Transfer from pot to personal pot
  const withdrawFromPotToPersonal = (potId: string, amount: number) => {
    const pot = pots.find(p => p.id === potId);
    if (!pot || pot.currentBalance < amount) {
      return false;
    }
    
    // Deduct from group pot
    updatePotBalance(potId, -amount);
    
    // Add to personal pot
    setPersonalPot((prev: { balance: number }) => ({
      ...prev,
      balance: prev.balance + amount
    }));
    
    // Add a transaction record
    addTransaction({
      id: generateId(),
      potId,
      type: 'withdrawal',
      amount,
      user: "Current User",
      description: "Transferred to personal pot",
      timestamp: new Date().toISOString(),
      balanceAfter: pot.currentBalance - amount,
      status: "completed"
    });
    
    // Check if pot goal is reached and pot is emptied
    if (pot.currentBalance - amount === 0 && pot.goalAmount <= pot.currentBalance) {
      completePot(potId);
    }
    
    return true;
  };

  // Approve withdrawal and transfer to Personal Pot
  const approveWithdrawalToPersonal = (potId: string, amount: number, recipient: string): boolean => {
    const pot = pots.find(p => p.id === potId);
    if (!pot || pot.currentBalance < amount) {
      return false;
    }
    
    // Deduct from pot balance
    updatePotBalance(potId, -amount);
    
    // Add to personal pot (assuming current user is receiving)
    setPersonalPot((prev: { balance: number }) => ({
      ...prev,
      balance: prev.balance + amount
    }));
    
    // Add transaction record
    addTransaction({
      id: generateId(),
      potId,
      type: 'withdrawal',
      amount,
      user: recipient,
      description: "Withdrawal approved - transferred to Personal Pot",
      timestamp: new Date().toISOString(),
      balanceAfter: pot.currentBalance - amount,
      status: "completed"
    });
    
    return true;
  };
  
  // Feedback operations
  const addFeedback = (newFeedback: any) => {
    setFeedback([...feedback, newFeedback]);
  };
  
  // Reset all data
  const resetAllData = () => {
    setPots(defaultPots);
    setTransactions(defaultTransactions);
    setChangeRequests([]);
    setFeedback([]);
    setSimulateErrors({
      depositFailure: false,
      withdrawalRejection: false,
      timeLock: false,
      invalidRecipient: false
    });
    setLiveMode(false);
  };
  
  // Generate a random test scenario
  const generateRandomScenario = () => {
    // Create a new random pot
    const potTypes = ["one-to-many", "many-to-one", "many-to-selected"];
    const withdrawalTypes = ["democratic", "admin", "timed"];
    const potNames = ["Family Trip Fund", "Emergency Savings", "Birthday Gift Collection", "Home Improvement Fund", "Group Vacation"];
    
    const randomPotType = potTypes[Math.floor(Math.random() * potTypes.length)] as "one-to-many" | "many-to-one" | "many-to-selected";
    const randomWithdrawalType = withdrawalTypes[Math.floor(Math.random() * withdrawalTypes.length)] as "democratic" | "admin" | "timed";
    const randomPotName = potNames[Math.floor(Math.random() * potNames.length)];
    const randomGoal = Math.floor(Math.random() * 1000) + 500;
    const randomBalance = Math.floor(Math.random() * randomGoal);
    
    // Create releaseDate if timed withdrawal (1-30 days in the future)
    const releaseDate = randomWithdrawalType === "timed" 
      ? new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    
    // Create voteThreshold if democratic withdrawal
    const voteThreshold = randomWithdrawalType === "democratic"
      ? [51, 66, 75, 100][Math.floor(Math.random() * 4)]
      : undefined;
    
    const newPot: PotType = {
      id: generateId(),
      name: randomPotName,
      description: `This is a randomly generated ${randomPotName} for testing purposes.`,
      goalAmount: randomGoal,
      currentBalance: randomBalance,
      payoutStructure: randomPotType,
      withdrawalMethod: randomWithdrawalType,
      voteThreshold,
      releaseDate,
      creator: "Current User",
      createdBy: "Current User",
      members: ["Current User", "Alice", "Bob", "Charlie", "David", "Emma"],
      recipients: randomPotType === "many-to-one" 
        ? ["Charlie"] 
        : randomPotType === "one-to-many"
          ? ["Alice", "Bob", "Charlie", "David", "Emma"]
          : ["Alice", "Charlie"],
      createdAt: new Date().toISOString()
    };
    
    // Generate random transactions for this pot
    const randomTransactionCount = Math.floor(Math.random() * 10) + 5;
    const userNames = ["Current User", "Alice", "Bob", "Charlie", "David", "Emma"];
    const newTransactions: TransactionType[] = [];
    
    let runningBalance = 0;
    for (let i = 0; i < randomTransactionCount; i++) {
      const randomUser = userNames[Math.floor(Math.random() * userNames.length)];
      const randomAmount = Math.floor(Math.random() * 100) + 10;
      const randomDaysAgo = Math.floor(Math.random() * 10);
      
      const txType = Math.random() > 0.7 ? "vote" : "deposit";
      
      if (txType === "deposit") {
        runningBalance += randomAmount;
      }
      
      newTransactions.push({
        id: generateId(),
        potId: newPot.id,
        type: txType,
        amount: txType === "deposit" ? randomAmount : undefined,
        user: randomUser,
        description: txType === "deposit" 
          ? "Random test deposit" 
          : "Voted on withdrawal request",
        timestamp: new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
        balanceAfter: txType === "deposit" ? runningBalance : undefined,
        voteCount: txType === "vote" ? Math.floor(Math.random() * 6) + 1 : undefined,
        voteTotal: txType === "vote" ? 6 : undefined,
        status: "completed"
      });
    }
    
    // Add a withdrawal request
    newTransactions.push({
      id: generateId(),
      potId: newPot.id,
      type: "request",
      amount: Math.floor(Math.random() * runningBalance * 0.8) + 1,
      user: newPot.recipients[0],
      description: "Random withdrawal request",
      timestamp: new Date().toISOString(),
      status: "pending"
    });
    
    // Update the pot's current balance to match the transactions
    newPot.currentBalance = runningBalance;
    
    // Add the new pot and transactions
    setPots([...pots, newPot]);
    setTransactions([...newTransactions, ...transactions]);
  };
  
  // Toggle error simulations
  const toggleSimulateDepositFailure = () => {
    setSimulateErrors({
      ...simulateErrors,
      depositFailure: !simulateErrors.depositFailure
    });
  };
  
  const toggleSimulateWithdrawalRejection = () => {
    setSimulateErrors({
      ...simulateErrors,
      withdrawalRejection: !simulateErrors.withdrawalRejection
    });
  };
  
  const toggleSimulateTimeLock = () => {
    setSimulateErrors({
      ...simulateErrors,
      timeLock: !simulateErrors.timeLock
    });
  };
  
  const toggleSimulateInvalidRecipient = () => {
    setSimulateErrors({
      ...simulateErrors,
      invalidRecipient: !simulateErrors.invalidRecipient
    });
  };
  
  const toggleLiveMode = () => {
    setLiveMode(!liveMode);
  };
  
  return (
    <PotContext.Provider
      value={{
        personalPot,
        pots: activePots,
        completedPots,
        savedPots,
        transactions,
        changeRequests,
        feedback,
        simulateErrors,
        liveMode,
        addPot,
        updatePot,
        deletePot,
        completePot,
        savePot,
        unsavePot,
        addTransaction,
        addChangeRequest,
        voteOnChangeRequest,
        updatePotBalance,
        updatePersonalPotBalance,
        depositFromPersonalToPot,
        withdrawFromPotToPersonal,
        approveWithdrawalToPersonal,
        addFeedback,
        resetAllData,
        generateRandomScenario,
        toggleSimulateDepositFailure,
        toggleSimulateWithdrawalRejection,
        toggleSimulateTimeLock,
        toggleSimulateInvalidRecipient,
        toggleLiveMode,
        hasSeenOnboarding,
        setHasSeenOnboarding
      }}
    >
      {children}
    </PotContext.Provider>
  );
};

export const usePot = () => {
  const context = useContext(PotContext);
  if (context === undefined) {
    throw new Error("usePot must be used within a PotProvider");
  }
  return context;
};
