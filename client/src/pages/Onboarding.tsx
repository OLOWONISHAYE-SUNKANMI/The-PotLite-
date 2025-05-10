import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import OnboardingCreatePot from "@/components/OnboardingCreatePot";
import { usePot } from "@/context/PotContext";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { pots } = usePot();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check localStorage to see if user has completed onboarding
    const onboardingStatus = localStorage.getItem('hasSeenOnboarding');
    
    // If they've seen onboarding OR there are already pots in the system, skip onboarding
    if (onboardingStatus === 'true' || pots.length > 0) {
      setHasCompletedOnboarding(true);
      setLocation('/');
    } else {
      setHasCompletedOnboarding(false);
    }
  }, [pots.length, setLocation]);

  // Handle completion of onboarding
  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setHasCompletedOnboarding(true);
    setLocation('/');
  };

  // Loading state
  if (hasCompletedOnboarding === null) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  // Show onboarding if needed
  if (hasCompletedOnboarding === false) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome to The Pot</h1>
          <p className="text-muted-foreground">
            Let's get started by creating your first savings pot.
          </p>
        </div>
        
        <OnboardingCreatePot onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Redirect to dashboard (this should not render as we redirect in useEffect)
  return null;
}