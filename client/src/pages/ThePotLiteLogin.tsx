import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { ThePotLiteAuthShell } from "@/components/ThePotLiteAuthShell";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ThePotLiteLogin: React.FC = () => {
  const { login, verifyTwoFactor, twoFactorChallenge, setTwoFactorChallenge } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuickFill = (role: "organizer" | "member") => {
    if (role === "organizer") {
      setUsernameOrEmail("coach_marcus");
      setPassword("CoachSecure2026!");
    } else {
      setUsernameOrEmail("sarah_j");
      setPassword("ParentSecure2026!");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your username/email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await login({ usernameOrEmail, password });
      if (result.requiresTwoFactor) {
        toast({
          title: "Two-Factor Verification Required",
          description: "Please enter the 6-digit code from your authenticator app.",
        });
      } else {
        toast({
          title: "Welcome Back!",
          description: `Logged in as ${result.user?.name}. Entering dashboard...`,
        });
        setLocation("/");
      }
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials. Please verify and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit numeric verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await verifyTwoFactor(totpCode);
      toast({
        title: "2FA Verified!",
        description: `Successfully signed in as ${user.name}. Entering dashboard...`,
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err.message || "Invalid code. For testing, code 123456 is accepted.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThePotLiteAuthShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>ThePotLite Pilot · Adult Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {twoFactorChallenge ? "Two-Factor Verification" : "Sign In to Your Account"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {twoFactorChallenge
              ? `Enter the 6-digit TOTP code for @${twoFactorChallenge.username}`
              : "Sign in to enter your club dashboard and obligation tracker"}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-8 transition-colors">
          {twoFactorChallenge ? (
            /* 2FA Challenge Form */
            <form onSubmit={handleTotpSubmit} className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <span className="font-bold block mb-0.5">Two-Factor Protected</span>
                  Organizer accounts require RFC 6238 time-based verification to prevent unauthorized payout approvals.
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  6-Digit Authentication Code
                </Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="h-14 text-center tracking-[0.5em] text-2xl font-black rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 text-center">
                  Enter code from Authenticator app or use demo code <strong className="text-purple-600 dark:text-purple-400 font-bold">123456</strong>
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTwoFactorChallenge(null)}
                  className="flex-1 rounded-full text-xs font-semibold py-2.5 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Back to Login
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-full text-xs font-bold py-2.5 bg-[#a3e635] hover:bg-[#8ece28] text-slate-950 shadow-md shadow-[#a3e635]/20"
                >
                  {loading ? "Verifying..." : "Verify & Enter Dashboard"}
                </Button>
              </div>
            </form>
          ) : (
            /* Normal Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Quick Demo Pre-fill Pills */}
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Quick Demo Access
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFill("organizer")}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors"
                  >
                    ⚡ Coach Marcus (Organizer)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill("member")}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors"
                  >
                    ⚡ Sarah Jenkins (Parent)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Username or Email
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="coach_marcus or email@example.com"
                    className="pl-10 h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Password
                  </Label>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">
                    Forgot?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-10 h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full text-xs font-bold py-3 bg-[#a3e635] hover:bg-[#8ece28] text-slate-950 shadow-md shadow-[#a3e635]/20 flex items-center justify-center gap-2"
                >
                  <span>{loading ? "Authenticating..." : "Sign In & Enter Dashboard"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Card Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an adult pilot account yet?{" "}
            <Link href="/register" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
              Register Here
            </Link>
          </div>
        </div>

        {/* COPPA & Governance Guarantee Notice */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">COPPA & Non-Custodial Compliance:</strong> Only adults (coaches and parents) authenticate. Youth athlete records are managed under parental authority with first name and last initial only. No payment credentials or banking cards are handled.
          </p>
        </div>
      </div>
    </ThePotLiteAuthShell>
  );
};
