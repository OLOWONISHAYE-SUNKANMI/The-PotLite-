import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./context/DummyUserContext";
import { PotProvider } from "./context/PotContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CreatePot from "./pages/CreatePot";
import PotDashboard from "./pages/PotDashboard";
import TransactionLog from "./pages/TransactionLog";
import FeedbackForm from "./pages/FeedbackForm";
import AdminPanel from "./pages/AdminPanel";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/not-found";
import ScrollToTop from "./components/ScrollToTop";
import { useEffect, useState } from "react";

function Router() {
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user has completed onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true';
    
    // If the user is accessing the root path and hasn't seen onboarding, redirect to onboarding
    if (location === '/' && !hasSeenOnboarding) {
      setLocation('/onboarding');
    }
    
    setIsLoading(false);
  }, [location, setLocation]);
  
  if (isLoading) return null;
  
  return (
    <Switch>
      <Route path="/" component={PotDashboard} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/create" component={CreatePot} />
      <Route path="/transactions" component={TransactionLog} />
      <Route path="/feedback" component={FeedbackForm} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <ScrollToTop />
          <Router />
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
