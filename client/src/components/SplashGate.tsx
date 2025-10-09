/**
 * SplashGate Component
 * 
 * Usage: Wrap your main app with this component to control one-time splash display.
 * Uses localStorage to track whether the user has seen the splash screen.
 * 
 * Example:
 *   <SplashGate>
 *     <App />
 *   </SplashGate>
 * 
 * To reset and see the splash again, clear localStorage key: hasSeenSplash
 */

import { useState, useEffect, ReactNode } from 'react';
import SplashScreen from './SplashScreen';

const SPLASH_STORAGE_KEY = 'hasSeenSplash';

interface SplashGateProps {
  children: ReactNode;
}

export default function SplashGate({ children }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user has already seen the splash
    const hasSeenSplash = localStorage.getItem(SPLASH_STORAGE_KEY);
    
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
    
    setIsLoading(false);
  }, []);

  const handleSplashDone = () => {
    // Mark splash as seen
    localStorage.setItem(SPLASH_STORAGE_KEY, 'true');
    setShowSplash(false);
  };

  // Don't render anything until we've checked localStorage
  if (isLoading) {
    return null;
  }

  if (showSplash) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  return <>{children}</>;
}
