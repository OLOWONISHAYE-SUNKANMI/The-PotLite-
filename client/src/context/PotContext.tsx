import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PotType, TransactionType, generateId } from "@/lib/utils";

interface PotContextType {
  pots: PotType[];
  transactions: TransactionType[];
  feedback: any[];
  simulateErrors: {
    depositFailure: boolean;
    withdrawalRejection: boolean;
    timeLock: boolean;
    invalidRecipient: boolean;
  };
  liveMode: boolean;
  addPot: (pot: PotType) => void;
  updatePot: (pot: PotType) => void;
  deletePot: (potId: string) => void;
  addTransaction: (transaction: TransactionType) => void;
  updatePotBalance: (potId: string, amount: number) => void;
  addFeedback: (feedback: any) => void;
  resetAllData: () => void;
  generateRandomScenario: () => void;
  toggleSimulateDepositFailure: () => void;
  toggleSimulateWithdrawalRejection: () => void;
  toggleSimulateTimeLock: () => void;
  toggleSimulateInvalidRecipient: () => void;
  toggleLiveMode: () => void;
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
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  }
];

interface PotProviderProps {
  children: ReactNode;
}

export const PotProvider = ({ children }: PotProviderProps) => {
  // Initialize state from localStorage or defaults
  const [pots, setPots] = useState<PotType[]>(() => {
    const storedPots = localStorage.getItem("thePot_pots");
    return storedPots ? JSON.parse(storedPots) : defaultPots;
  });
  
  const [transactions, setTransactions] = useState<TransactionType[]>(() => {
    const storedTransactions = localStorage.getItem("thePot_transactions");
    return storedTransactions ? JSON.parse(storedTransactions) : defaultTransactions;
  });
  
  const [feedback, setFeedback] = useState<any[]>(() => {
    const storedFeedback = localStorage.getItem("thePot_feedback");
    return storedFeedback ? JSON.parse(storedFeedback) : [];
  });
  
  const [simulateErrors, setSimulateErrors] = useState({
    depositFailure: false,
    withdrawalRejection: false,
    timeLock: false,
    invalidRecipient: false
  });
  
  const [liveMode, setLiveMode] = useState(false);
  
  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem("thePot_pots", JSON.stringify(pots));
  }, [pots]);
  
  useEffect(() => {
    localStorage.setItem("thePot_transactions", JSON.stringify(transactions));
  }, [transactions]);
  
  useEffect(() => {
    localStorage.setItem("thePot_feedback", JSON.stringify(feedback));
  }, [feedback]);
  
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
  
  // Transaction operations
  const addTransaction = (transaction: TransactionType) => {
    setTransactions([transaction, ...transactions]);
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
  
  // Feedback operations
  const addFeedback = (newFeedback: any) => {
    setFeedback([...feedback, newFeedback]);
  };
  
  // Reset all data
  const resetAllData = () => {
    setPots(defaultPots);
    setTransactions(defaultTransactions);
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
        pots,
        transactions,
        feedback,
        simulateErrors,
        liveMode,
        addPot,
        updatePot,
        deletePot,
        addTransaction,
        updatePotBalance,
        addFeedback,
        resetAllData,
        generateRandomScenario,
        toggleSimulateDepositFailure,
        toggleSimulateWithdrawalRejection,
        toggleSimulateTimeLock,
        toggleSimulateInvalidRecipient,
        toggleLiveMode
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
