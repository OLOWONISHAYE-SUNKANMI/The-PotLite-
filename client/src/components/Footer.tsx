import { Link, useLocation } from "wouter";
import { usePot } from "@/context/PotContext";

const Footer = () => {
  const [location] = useLocation();
  const { pots, hasSeenOnboarding } = usePot();
  
  // Check if user is in onboarding
  const isOnboarding = location === '/onboarding' || (!hasSeenOnboarding && pots.length === 0);
  
  return (
    <footer className="bg-secondary py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="text-primary font-bold">The Pot</span>
            <span className="text-secondary-foreground ml-2 text-sm">Sandbox MVP v1.0</span>
          </div>
          {!isOnboarding && (
            <div className="flex space-x-4">
              <Link href="#">
                <a className="text-secondary-foreground hover:text-primary">Privacy</a>
              </Link>
              <Link href="#">
                <a className="text-secondary-foreground hover:text-primary">Terms</a>
              </Link>
              <Link href="/feedback">
                <a className="text-secondary-foreground hover:text-primary">Feedback</a>
              </Link>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
