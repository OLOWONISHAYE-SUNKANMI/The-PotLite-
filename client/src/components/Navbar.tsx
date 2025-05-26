import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { usePot } from "@/context/PotContext";
import { FaPiggyBank, FaBell } from "react-icons/fa";
import { FaBars, FaTimes } from "react-icons/fa";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  currentPath: string;
  onClick?: () => void;
};

const NavLink = ({ href, children, currentPath, onClick }: NavLinkProps) => {
  const isActive = currentPath === href;
  
  return (
    <Link href={href}>
      <a 
        className={cn(
          "px-3 py-2 rounded-md text-sm font-medium",
          isActive 
            ? "text-primary" 
            : "text-secondary-foreground hover:text-primary"
        )}
        onClick={onClick}
      >
        {children}
      </a>
    </Link>
  );
};

const MobileNavLink = ({ href, children, currentPath, onClick }: NavLinkProps) => {
  const isActive = currentPath === href;
  
  return (
    <Link href={href}>
      <a 
        className={cn(
          "block px-3 py-2 rounded-md text-base font-medium",
          isActive 
            ? "text-primary" 
            : "text-secondary-foreground hover:text-primary"
        )}
        onClick={onClick}
      >
        {children}
      </a>
    </Link>
  );
};

const Navbar = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pots, hasSeenOnboarding } = usePot();
  
  // Hide navbar links during onboarding
  const isOnboarding = location === '/onboarding' || (!hasSeenOnboarding && pots.length === 0);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);
  
  return (
    <nav className="sticky top-0 z-50 bg-secondary shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <a className="text-primary text-xl font-bold flex items-center">
                  <FaPiggyBank className="mr-2" />
                  The Pot
                </a>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {!isOnboarding && (
              <>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    <NavLink href="/" currentPath={location}>Dashboard</NavLink>
                    <NavLink href="/create" currentPath={location}>Create Pot</NavLink>
                    <NavLink href="/feedback" currentPath={location}>Feedback</NavLink>
                    <NavLink href="/admin" currentPath={location}>Admin</NavLink>
                  </div>
                </div>
                
                {/* Notifications Bell - moved to far right */}
                <div className="hidden md:block ml-6">
                  <Link href="/transactions">
                    <a className={cn(
                      "relative inline-flex items-center px-3 py-2 rounded-md text-sm font-medium",
                      location === "/transactions" 
                        ? "text-primary" 
                        : "text-secondary-foreground hover:text-primary"
                    )}>
                      <FaBell className="w-5 h-5" />
                      {/* Notification badges */}
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        3
                      </span>
                    </a>
                  </Link>
                </div>
                
                <div className="md:hidden flex items-center">
                  <button 
                    onClick={toggleMenu}
                    className="text-primary"
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                  >
                    {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {!isOnboarding && (
        <div className={cn("md:hidden bg-secondary pb-3 px-4", isMenuOpen ? "block" : "hidden")}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink href="/" currentPath={location} onClick={closeMenu}>
              Dashboard
            </MobileNavLink>
            <MobileNavLink href="/create" currentPath={location} onClick={closeMenu}>
              Create Pot
            </MobileNavLink>
            <MobileNavLink href="/transactions" currentPath={location} onClick={closeMenu}>
              Transactions
            </MobileNavLink>
            <MobileNavLink href="/feedback" currentPath={location} onClick={closeMenu}>
              Feedback
            </MobileNavLink>
            <MobileNavLink href="/admin" currentPath={location} onClick={closeMenu}>
              Admin
            </MobileNavLink>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
