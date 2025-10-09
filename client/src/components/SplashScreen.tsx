/**
 * SplashScreen Component
 * 
 * Usage: Displays on first app load, user clicks button to dismiss.
 * To swap in your real logo: Replace logo.png in the client/src/assets folder.
 * 
 * Props:
 *  - onDone: Callback fired when splash is dismissed
 *  - bullets: Optional array of feature strings (defaults to built-in list)
 */

import { useState } from 'react';
import '../styles/splash.css';
import logoImage from '../assets/logo.png';

interface SplashScreenProps {
  onDone: () => void;
  bullets?: string[];
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
  bullets = DEFAULT_BULLETS
}: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  const handleDismiss = () => {
    setFadeOut(true);
    // Wait for fade-out animation to complete
    setTimeout(() => {
      onDone();
    }, 300); // matches fade-out duration
  };

  return (
    <div className={`splash-overlay ${fadeOut ? 'fade-out' : 'fade-in'}`}>
      <div className="splash-content">
        {/* Logo */}
        <div className="splash-logo-container">
          <img 
            src={logoImage} 
            alt="The Pot Logo" 
            className="splash-logo"
          />
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

        {/* Start Button */}
        <button 
          className="splash-start-btn"
          onClick={handleDismiss}
          aria-label="Start using The Pot"
        >
          Start Saving Together!
        </button>
      </div>
    </div>
  );
}
