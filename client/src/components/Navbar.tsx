import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import { FaPiggyBank } from "react-icons/fa";
import { FaBars, FaTimes } from "react-icons/fa";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  currentPath: string;
};

const NavLink = ({ href, children, currentPath }: NavLinkProps) => {
  const isActive = currentPath === href;
  
  return (
    <Link href={href}>
      <a className={cn(
        "px-3 py-2 rounded-md text-sm font-medium",
        isActive 
          ? "text-primary" 
          : "text-secondary-foreground hover:text-primary"
      )}>
        {children}
      </a>
    </Link>
  );
};

const Navbar = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
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
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink href="/" currentPath={location}>Dashboard</NavLink>
                <NavLink href="/create" currentPath={location}>Create Pot</NavLink>
                <NavLink href="/transactions" currentPath={location}>Transactions</NavLink>
                <NavLink href="/feedback" currentPath={location}>Feedback</NavLink>
                <NavLink href="/admin" currentPath={location}>Admin</NavLink>
              </div>
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
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn("md:hidden bg-secondary pb-3 px-4", isMenuOpen ? "block" : "hidden")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/">
            <a className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/" 
                ? "text-primary" 
                : "text-secondary-foreground hover:text-primary"
            )}>
              Dashboard
            </a>
          </Link>
          <Link href="/create">
            <a className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/create" 
                ? "text-primary" 
                : "text-secondary-foreground hover:text-primary"
            )}>
              Create Pot
            </a>
          </Link>
          <Link href="/transactions">
            <a className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/transactions" 
                ? "text-primary" 
                : "text-secondary-foreground hover:text-primary"
            )}>
              Transactions
            </a>
          </Link>
          <Link href="/feedback">
            <a className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/feedback" 
                ? "text-primary" 
                : "text-secondary-foreground hover:text-primary"
            )}>
              Feedback
            </a>
          </Link>
          <Link href="/admin">
            <a className={cn(
              "block px-3 py-2 rounded-md text-base font-medium",
              location === "/admin" 
                ? "text-primary" 
                : "text-secondary-foreground hover:text-primary"
            )}>
              Admin
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
