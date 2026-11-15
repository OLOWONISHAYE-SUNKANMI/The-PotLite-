import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "./context/DummyUserContext";
import { PotProvider } from "./context/PotContext";
import { ThePotLiteThemeProvider } from "./context/ThePotLiteThemeContext";
import { ThePotLiteProvider, useThePotLite } from "./context/ThePotLiteContext";
import { ThePotLiteAppShell } from "./components/ThePotLiteAppShell";
import { ThePotLiteOrganizerDashboard } from "./pages/ThePotLiteOrganizerDashboard";
import { ThePotLiteMemberDashboard } from "./pages/ThePotLiteMemberDashboard";
import { ThePotLiteInviteLanding } from "./pages/ThePotLiteInviteLanding";
import { ThePotLiteAuditLog } from "./pages/ThePotLiteAuditLog";
import CreatePot from "./pages/CreatePot";
import FeedbackForm from "./pages/FeedbackForm";
import PotDashboard from "./pages/PotDashboard";
import NotFound from "./pages/not-found";

function ThePotLiteHome() {
  const { currentUser } = useThePotLite();
  return currentUser.role === "Organizer" ? (
    <ThePotLiteOrganizerDashboard />
  ) : (
    <ThePotLiteMemberDashboard />
  );
}

function AppRouter() {
  return (
    <Switch>
      {/* ThePotLite V1 Pilot Routes */}
      <Route path="/" component={ThePotLiteHome} />
      <Route path="/organizer" component={ThePotLiteOrganizerDashboard} />
      <Route path="/member" component={ThePotLiteMemberDashboard} />
      <Route path="/invite/:id" component={ThePotLiteInviteLanding} />
      <Route path="/audit" component={ThePotLiteAuditLog} />
      <Route path="/create" component={CreatePot} />
      <Route path="/feedback" component={FeedbackForm} />
      <Route path="/legacy" component={PotDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThePotLiteThemeProvider>
        <ThemeProvider>
          <PotProvider>
            <ThePotLiteProvider>
              <ThePotLiteAppShell>
                <AppRouter />
                <Toaster />
              </ThePotLiteAppShell>
            </ThePotLiteProvider>
          </PotProvider>
        </ThemeProvider>
      </ThePotLiteThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
