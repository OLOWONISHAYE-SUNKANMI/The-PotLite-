import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./context/DummyUserContext";
import { PotProvider, usePot } from "./context/PotContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CreatePot from "./pages/CreatePot";
import AiPotCreator from "./pages/AiPotCreator";
import PotDashboard from "./pages/PotDashboard";
import TransactionLog from "./pages/TransactionLog";
import FeedbackForm from "./pages/FeedbackForm";
import AdminPanel from "./pages/AdminPanel";
import Onboarding from "./pages/Onboarding";
import VoterDemo from "./pages/VoterDemo";
import RecipientDemo from "./pages/RecipientDemo";
import NotFound from "./pages/not-found";
import ScrollToTop from "./components/ScrollToTop";
import FeatureChecklist from "./components/FeatureChecklist";
import FeedbackModal from "./components/FeedbackModal";
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
      <Route path="/ai-create" component={AiPotCreator} />
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
  const [showChecklist, setShowChecklist] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Function to handle when checklist is completed
  const handleChecklistComplete = () => {
    setShowFeedbackModal(true);
  };
  
  // Function to handle when feedback modal is closed
  const handleFeedbackModalClose = () => {
    setShowFeedbackModal(false);
    // Hide the checklist after feedback is submitted
    setShowChecklist(false);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-grow ${isOnboarding ? 'flex items-center justify-center' : ''}`}>
        <div className={`${isOnboarding ? 'w-full max-w-2xl' : 'max-w-7xl'} mx-auto px-4 py-6 sm:px-6 lg:px-8`}>
          <ScrollToTop />
          
          {/* Show the feature checklist if not in onboarding and checklist is visible */}
          {!isOnboarding && showChecklist && (
            <div className="mb-6">
              <FeatureChecklist onComplete={handleChecklistComplete} />
            </div>
          )}
          
          <AppRouter />
          
          {/* Feedback modal when all checklist items are completed */}
          <FeedbackModal 
            open={showFeedbackModal} 
            onClose={handleFeedbackModalClose} 
          />
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PotProvider>
          <AppContent />
        </PotProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
