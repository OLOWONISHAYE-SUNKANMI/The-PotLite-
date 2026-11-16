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
import { ThePotLiteLogin } from "./pages/ThePotLiteLogin";
import { ThePotLiteRegister } from "./pages/ThePotLiteRegister";
import { ThePotLiteTwoFactor } from "./pages/ThePotLiteTwoFactor";
import CreatePot from "./pages/CreatePot";
import FeedbackForm from "./pages/FeedbackForm";
import ThePotLiteLegacyArchive from "./pages/ThePotLiteLegacyArchive";
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
  const { isAuthenticated } = useThePotLite();

  // If unauthenticated: Re-route root and dashboard routes to Login & Register first
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/register" component={ThePotLiteRegister} />
        <Route path="/auth/2fa" component={ThePotLiteTwoFactor} />
        <Route path="/login" component={ThePotLiteLogin} />
        <Route component={ThePotLiteLogin} />
      </Switch>
    );
  }

  // If authenticated: Full access to Dashboard & Pages wrapped in ThePotLiteAppShell
  return (
    <Switch>
      {/* Standalone Auth Routes (Accessible if user wants to switch accounts) */}
      <Route path="/login" component={ThePotLiteLogin} />
      <Route path="/register" component={ThePotLiteRegister} />
      <Route path="/auth/2fa" component={ThePotLiteTwoFactor} />

      {/* ThePotLite V1 Pilot Dashboard Pages */}
      <Route>
        <ThePotLiteAppShell>
          <Switch>
            <Route path="/" component={ThePotLiteHome} />
            <Route path="/organizer" component={ThePotLiteOrganizerDashboard} />
            <Route path="/member" component={ThePotLiteMemberDashboard} />
            <Route path="/invite/:id" component={ThePotLiteInviteLanding} />
            <Route path="/audit" component={ThePotLiteAuditLog} />
            <Route path="/create" component={CreatePot} />
            <Route path="/feedback" component={FeedbackForm} />
            <Route path="/legacy" component={ThePotLiteLegacyArchive} />
            <Route component={NotFound} />
          </Switch>
        </ThePotLiteAppShell>
      </Route>
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
              <AppRouter />
              <Toaster />
            </ThePotLiteProvider>
          </PotProvider>
        </ThemeProvider>
      </ThePotLiteThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
