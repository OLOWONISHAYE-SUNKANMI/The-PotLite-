import React, { useState, useEffect } from 'react';
import { usePot } from '@/context/PotContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from 'wouter';
import { FaCheckCircle, FaRegCircle, FaPiggyBank, FaHandHoldingUsd, FaExchangeAlt, FaBullseye, FaVoteYea } from 'react-icons/fa';

const checklistItems = [
  { 
    id: 1, 
    label: 'Create a Pot and Invite Members', 
    key: 'createPot',
    icon: <FaPiggyBank className="mr-2" />,
    path: '/create'
  },
  { 
    id: 2, 
    label: 'Deposit into an Active Pot', 
    key: 'depositPot',
    icon: <FaHandHoldingUsd className="mr-2" />,
    path: '/'
  },
  { 
    id: 3, 
    label: 'Request a Withdrawal from an Active Pot', 
    key: 'requestWithdraw',
    icon: <FaExchangeAlt className="mr-2" />,
    path: '/'
  },
  { 
    id: 4, 
    label: 'Request a Goal Change in an Active Pot', 
    key: 'goalChange',
    icon: <FaBullseye className="mr-2" />,
    path: '/'
  },
  { 
    id: 5, 
    label: 'Cast Your Vote on a Withdrawal Request', 
    key: 'vote',
    icon: <FaVoteYea className="mr-2" />,
    path: '/voter-demo'
  },
];

interface FeatureChecklistProps {
  onComplete: () => void;
}

const FeatureChecklist: React.FC<FeatureChecklistProps> = ({ onComplete }) => {
  const { pots, transactions } = usePot();
  const [, navigate] = useLocation();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<number>(0);

  // Check actions based on context changes
  useEffect(() => {
    const updatedChecked = { ...checked };
    
    // Check if user created a pot
    if (pots.length > 0 && !updatedChecked.createPot) {
      updatedChecked.createPot = true;
    }
    
    // Check if user made a deposit
    if (transactions.some(t => t.type === 'deposit') && !updatedChecked.depositPot) {
      updatedChecked.depositPot = true;
    }
    
    // Check if user requested a withdrawal
    if (transactions.some(t => t.type === 'withdrawal' && t.status === 'pending') && !updatedChecked.requestWithdraw) {
      updatedChecked.requestWithdraw = true;
    }
    
    // Goal change is harder to track automatically, keeping it manual for now
    
    // Check if user cast a vote
    if (transactions.some(t => t.type === 'vote') && !updatedChecked.vote) {
      updatedChecked.vote = true;
    }
    
    // Only update if there are changes
    if (JSON.stringify(updatedChecked) !== JSON.stringify(checked)) {
      setChecked(updatedChecked);
    }
  }, [pots, transactions, checked]);

  // Calculate progress when checked changes
  useEffect(() => {
    const completedCount = Object.values(checked).filter(Boolean).length;
    const progressPercentage = (completedCount / checklistItems.length) * 100;
    setProgress(progressPercentage);
    
    // If all items are completed, trigger onComplete
    if (completedCount === checklistItems.length) {
      onComplete();
    }
  }, [checked, onComplete]);

  const handleItemClick = (path: string, key: string) => {
    // Navigate to the appropriate page
    navigate(path);
    
    // For items that can't be auto-detected, we'll mark them as complete on click
    if (key === 'goalChange' && !checked.goalChange) {
      const updatedChecked = { ...checked, [key]: true };
      setChecked(updatedChecked);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-md border-primary/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary flex items-center">
          📝 Sandbox Testing Checklist
        </h2>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          {Math.round(progress)}% Complete
        </Badge>
      </div>
      
      <div className="space-y-3">
        {checklistItems.map(item => (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full justify-start py-3 transition-all ${
              checked[item.key] 
                ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary' 
                : 'hover:bg-primary/10'
            }`}
            onClick={() => handleItemClick(item.path, item.key)}
          >
            <div className="flex items-center w-full">
              <span className="text-lg mr-2">
                {checked[item.key] ? <FaCheckCircle className="text-primary" /> : <FaRegCircle />}
              </span>
              <span className="flex items-center">
                {item.icon} {item.label}
              </span>
            </div>
          </Button>
        ))}
      </div>
      
      {progress === 100 && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md text-green-700">
          <p className="text-center font-medium">🎉 All items completed! Proceeding to feedback...</p>
        </div>
      )}
    </Card>
  );
};

export default FeatureChecklist;