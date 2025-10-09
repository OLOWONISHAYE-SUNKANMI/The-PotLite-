/**
 * SplashScreen Component
 * 
 * Usage: Displays on first app load, fades out after timeout, prevents showing again.
 * To swap in your real logo: Replace /assets/logo.png in the public/assets folder.
 * 
 * Props:
 *  - onDone: Callback fired when splash is dismissed (timeout or skip)
 *  - bullets: Optional array of feature strings (defaults to built-in list)
 *  - timeout: Optional timeout in ms (default 4000)
 */

import { useEffect, useState } from 'react';
import '../styles/splash.css';

// Configurable timeout (milliseconds)
const DEFAULT_TIMEOUT = 4000;

interface SplashScreenProps {
  onDone: () => void;
  bullets?: string[];
  timeout?: number;
}

const DEFAULT_BULLETS = [
  "Plan and fund group goals with transparency",
  "Flexible withdrawal rules that fit your use case",
  "Real-time progress and reminders",
  "Built-in accountability & fewer awkward money chats",
  "Earnable perks and smarter promo-code payouts",
  "Ready for roommates, teams, and group trips"
];

export default function SplashScreen({ 
  onDone, 
  bullets = DEFAULT_BULLETS,
  timeout = DEFAULT_TIMEOUT 
}: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    // Auto-dismiss after timeout
    const timer = setTimeout(() => {
      handleDismiss();
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  const handleDismiss = () => {
    setFadeOut(true);
    // Wait for fade-out animation to complete
    setTimeout(() => {
      onDone();
    }, 300); // matches fade-out duration
  };

  return (
    <div className={`splash-overlay ${fadeOut ? 'fade-out' : 'fade-in'}`}>
      <div className="splash-card">
        {/* Logo */}
        <div className="splash-logo-container">
          {!logoError ? (
            <img 
              src="/assets/logo.png" 
              alt="The Pot Logo" 
              className="splash-logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="splash-text-logo">The Pot</div>
          )}
        </div>

        {/* Tagline */}
        <h1 className="splash-tagline">
          Get started with the new Community Banking System
        </h1>

        {/* Feature List */}
        <div className="splash-features">
          <h2 className="splash-features-title">What's inside The Pot</h2>
          <ul className="splash-features-list">
            {bullets.map((bullet, index) => (
              <li key={index} className="splash-feature-item">
                <span className="splash-bullet-icon">✓</span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="splash-footer">
          Prototype preview — features subject to change.
        </p>

        {/* Skip Button */}
        <button 
          className="splash-skip-btn"
          onClick={handleDismiss}
          aria-label="Skip splash screen"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
