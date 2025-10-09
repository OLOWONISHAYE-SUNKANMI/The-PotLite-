/**
 * SplashGate Component
 * 
 * Usage: Wrap your main app with this component to show splash on every load.
 * Splash screen appears on every app load and requires user to click button to proceed.
 * 
 * Example:
 *   <SplashGate>
 *     <App />
 *   </SplashGate>
 */

import { useState, ReactNode } from 'react';
import SplashScreen from './SplashScreen';

interface SplashGateProps {
  children: ReactNode;
}

export default function SplashGate({ children }: SplashGateProps) {
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const handleSplashDone = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  return <>{children}</>;
}
