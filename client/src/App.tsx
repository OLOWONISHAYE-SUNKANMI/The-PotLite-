import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./context/DummyUserContext";
import { PotProvider, usePot } from "./context/PotContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CreatePot from "./pages/CreatePot";
import PotDashboard from "./pages/PotDashboard";
import TransactionLog from "./pages/TransactionLog";
import FeedbackForm from "./pages/FeedbackForm";
import AdminPanel from "./pages/AdminPanel";
import Onboarding from "./pages/Onboarding";
import VoterDemo from "./pages/VoterDemo";
import RecipientDemo from "./pages/RecipientDemo";
import NotFound from "./pages/not-found";
import ScrollToTop from "./components/ScrollToTop";
import { useEffect, useState } from "react";

function AppRouter() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const { pots, hasSeenOnboarding } = usePot();
  
  useEffect(() => {
    // Avoid redirects from the onboarding page
    if (location === '/onboarding') {
      setIsLoading(false);
      return;
    }
    
    // If the user is accessing the root path and hasn't seen onboarding and has no pots, redirect to onboarding
    if (location === '/' && !hasSeenOnboarding && pots.length === 0) {
      setLocation('/onboarding');
    }
    
    setIsLoading(false);
  }, [location, setLocation, pots.length, hasSeenOnboarding]);
  
  if (isLoading) return null;
  
  return (
    <Switch>
      <Route path="/" component={PotDashboard} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/create" component={CreatePot} />
      <Route path="/transactions" component={TransactionLog} />
      <Route path="/feedback" component={FeedbackForm} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/voter-demo" component={VoterDemo} />
      <Route path="/recipient-demo" component={RecipientDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { pots, hasSeenOnboarding } = usePot();
  const [location] = useLocation();
  const isOnboarding = location === '/onboarding' || (!hasSeenOnboarding && pots.length === 0);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-grow ${isOnboarding ? 'flex items-center justify-center' : ''}`}>
        <div className={`${isOnboarding ? 'w-full max-w-2xl' : 'max-w-7xl'} mx-auto px-4 py-6 sm:px-6 lg:px-8`}>
          <ScrollToTop />
          <AppRouter />
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <PotProvider>
        <AppContent />
      </PotProvider>
    </ThemeProvider>
  );
}

export default App;
