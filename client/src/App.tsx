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
import Onboarding from "./pages/Onboarding";
import { ThePotLiteProfile } from "./pages/ThePotLiteProfile";
import NotFound from "./pages/not-found";

function ThePotLiteHome() {
  const { currentUser } = useThePotLite();
  return currentUser.role === "Organizer" ? (
    <ThePotLiteOrganizerDashboard />
  ) : (
    <ThePotLiteMemberDashboard />
  );
}

// Role-Based Access Control: Organizers cannot access Member routes and vice-versa
function OrganizerOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { currentUser } = useThePotLite();
  if (currentUser.role !== "Organizer") {
    return <ThePotLiteMemberDashboard />;
  }
  return <Component />;
}

function MemberOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { currentUser } = useThePotLite();
  if (currentUser.role !== "Member") {
    return <ThePotLiteOrganizerDashboard />;
  }
  return <Component />;
}

function AppRouter() {
  const { isAuthenticated, currentUser } = useThePotLite();

  const hasCompletedOnboarding =
    currentUser.onboardingCompleted ||
    localStorage.getItem("thepotlite_onboarding_completed") === "true";

  // If unauthenticated: Re-route root and dashboard routes to Login & Register first
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/register" component={ThePotLiteRegister} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/auth/2fa" component={ThePotLiteTwoFactor} />
        <Route path="/login" component={ThePotLiteLogin} />
        <Route component={ThePotLiteLogin} />
      </Switch>
    );
  }

  // If registered but haven't completed the 10-step profile setup authentication
  if (!hasCompletedOnboarding) {
    return (
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/login" component={ThePotLiteLogin} />
        <Route component={Onboarding} />
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
      <Route path="/onboarding" component={Onboarding} />

      {/* ThePotLite V1 Pilot Dashboard Pages */}
      <Route>
        <ThePotLiteAppShell>
          <Switch>
            <Route path="/" component={ThePotLiteHome} />
            <Route path="/organizer">
              {() => <OrganizerOnlyRoute component={ThePotLiteOrganizerDashboard} />}
            </Route>
            <Route path="/member">
              {() => <MemberOnlyRoute component={ThePotLiteMemberDashboard} />}
            </Route>
            <Route path="/create">
              {() => <OrganizerOnlyRoute component={CreatePot} />}
            </Route>
            <Route path="/profile" component={ThePotLiteProfile} />
            <Route path="/invite/:id" component={ThePotLiteInviteLanding} />
            <Route path="/audit" component={ThePotLiteAuditLog} />
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
        <ThePotLiteProvider>
          <ThemeProvider>
            <PotProvider>
              <AppRouter />
              <Toaster />
            </PotProvider>
          </ThemeProvider>
        </ThePotLiteProvider>
      </ThePotLiteThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
