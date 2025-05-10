import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PotType, generateId } from "@/lib/utils";
import { usePot } from "@/context/PotContext";
import { useDummyUser } from "@/context/DummyUserContext";

interface OnboardingCreatePotProps {
  onComplete: () => void;
}

type OnboardingFormData = {
  name: string;
  description: string;
  members: string;
  goalAmount: string;
  payoutStructure: 'one-to-many' | 'many-to-one' | 'many-to-selected' | '';
  withdrawalMethod: 'democratic' | 'admin' | 'timed' | '';
  releaseDate?: string;
  voteThreshold?: string;
};

const OnboardingCreatePot: React.FC<OnboardingCreatePotProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const { addPot } = usePot();
  const { currentUser } = useDummyUser();
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    description: '',
    members: '',
    goalAmount: '1000',
    payoutStructure: '',
    withdrawalMethod: '',
    releaseDate: undefined,
    voteThreshold: '50'
  });

  const handleChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Convert the form data to a PotType
    const membersList = formData.members
      ? formData.members.split(',').map(m => m.trim())
      : [];
    
    const newPot: PotType = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      goalAmount: parseFloat(formData.goalAmount) || 1000,
      currentBalance: 0,
      createdBy: currentUser,
      creator: currentUser,
      payoutStructure: formData.payoutStructure as 'one-to-many' | 'many-to-one' | 'many-to-selected',
      withdrawalMethod: formData.withdrawalMethod as 'democratic' | 'admin' | 'timed',
      voteThreshold: formData.voteThreshold ? parseInt(formData.voteThreshold) : 50,
      releaseDate: formData.releaseDate,
      members: [currentUser, ...membersList],
      recipients: formData.payoutStructure === 'many-to-one' 
        ? [membersList[0] || currentUser] 
        : membersList,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // Add the pot to the context
    addPot(newPot);
    
    // Mark onboarding as complete in localStorage
    localStorage.setItem('hasSeenOnboarding', 'true');
    
    // Call the completion callback
    onComplete();
  };

  const validateCurrentStep = (): boolean => {
    switch (step) {
      case 0: // Title & Description
        return !!formData.name && !!formData.description && !!formData.goalAmount;
      case 1: // Members
        return true; // Members can be empty
      case 2: // Payout method
        return !!formData.payoutStructure;
      case 3: // Withdrawal method
        return !!formData.withdrawalMethod;
      default:
        return false;
    }
  };

  const steps = [
    // Step 1: Title & Description
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pot-name">Pot Name</Label>
          <Input 
            id="pot-name"
            placeholder="e.g., Vacation Fund" 
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pot-description">Description</Label>
          <Textarea 
            id="pot-description"
            placeholder="What is this pot for?" 
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pot-goal">Goal Amount</Label>
          <Input 
            id="pot-goal"
            placeholder="1000" 
            type="number"
            value={formData.goalAmount}
            onChange={(e) => handleChange('goalAmount', e.target.value)}
          />
        </div>
      </div>
    </>,

    // Step 2: Members
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pot-members">Invite Members</Label>
          <Textarea 
            id="pot-members"
            placeholder="Enter emails or usernames separated by commas" 
            rows={4}
            value={formData.members}
            onChange={(e) => handleChange('members', e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            This is a simulation - no actual invites will be sent.
          </p>
        </div>
      </div>
    </>,

    // Step 3: Payout Structure
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payout-structure">Payout Method</Label>
          <Select 
            value={formData.payoutStructure} 
            onValueChange={(value) => handleChange('payoutStructure', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payout method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="many-to-one">Many-to-One (Group funds one person)</SelectItem>
              <SelectItem value="one-to-many">One-to-Many (One funds group)</SelectItem>
              <SelectItem value="many-to-selected">Many-to-Selected (Group funds selected people)</SelectItem>
            </SelectContent>
          </Select>
          
          {formData.payoutStructure && (
            <div className="p-3 bg-muted rounded-md mt-3">
              <p className="text-sm">
                {formData.payoutStructure === 'many-to-one' && 
                  'Everyone contributes, one person receives the funds.'}
                {formData.payoutStructure === 'one-to-many' && 
                  'One person contributes, everyone in the group receives funds.'}
                {formData.payoutStructure === 'many-to-selected' && 
                  'Everyone contributes, selected members receive funds.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>,

    // Step 4: Withdrawal Method
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="withdrawal-method">Withdrawal Method</Label>
          <Select 
            value={formData.withdrawalMethod} 
            onValueChange={(value) => handleChange('withdrawalMethod', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select withdrawal method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="democratic">Democratic Vote</SelectItem>
              <SelectItem value="admin">Admin Approval</SelectItem>
              <SelectItem value="timed">Timed Release</SelectItem>
            </SelectContent>
          </Select>
          
          {formData.withdrawalMethod && (
            <div className="p-3 bg-muted rounded-md mt-3">
              <p className="text-sm">
                {formData.withdrawalMethod === 'democratic' && 
                  'Members must vote to approve withdrawals.'}
                {formData.withdrawalMethod === 'admin' && 
                  'Only the pot creator can approve withdrawals.'}
                {formData.withdrawalMethod === 'timed' && 
                  'Funds are automatically released on a specific date.'}
              </p>
            </div>
          )}
        </div>

        {formData.withdrawalMethod === 'democratic' && (
          <div className="space-y-2">
            <Label htmlFor="vote-threshold">Vote Threshold (%)</Label>
            <Input 
              id="vote-threshold"
              type="number"
              min="1" 
              max="100"
              value={formData.voteThreshold}
              onChange={(e) => handleChange('voteThreshold', e.target.value)}
            />
          </div>
        )}

        {formData.withdrawalMethod === 'timed' && (
          <div className="space-y-2">
            <Label htmlFor="release-date">Release Date</Label>
            <Input 
              id="release-date"
              type="date"
              value={formData.releaseDate}
              onChange={(e) => handleChange('releaseDate', e.target.value)}
            />
          </div>
        )}
      </div>
    </>
  ];

  const stepTitles = [
    "Pot Details",
    "Invite Members",
    "Payout Method",
    "Withdrawal Method"
  ];
  
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-primary/20">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <CardTitle className="text-2xl text-primary">🎉 Create Your First Pot</CardTitle>
        <CardDescription>
          Step {step + 1} of 4: {stepTitles[step]}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {steps[step]}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button 
          variant="outline" 
          onClick={() => setStep(Math.max(0, step - 1))} 
          disabled={step === 0}
        >
          Back
        </Button>
        
        {step < steps.length - 1 ? (
          <Button 
            onClick={() => setStep(step + 1)} 
            disabled={!validateCurrentStep()}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={!validateCurrentStep()}
          >
            Create Pot
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default OnboardingCreatePot;