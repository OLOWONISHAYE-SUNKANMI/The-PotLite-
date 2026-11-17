import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { ThePotLiteAuthLayout } from "@/components/ThePotLiteAuthLayout";
import {
  Eye,
  EyeOff,
  Lock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const ThePotLiteLogin: React.FC = () => {
  const {
    login,
    verifySmsCode,
  } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [smsStep, setSmsStep] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetPhone, setTargetPhone] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = usernameOrEmail.trim();

    if (!identifier || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your username or email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await login({
        usernameOrEmail: identifier,
        password,
      });

      if (result.requiresTwoFactor) {
        setTargetPhone(result.challenge?.phone || "");
        setSmsStep(true);
        toast({
          title: "2FA Verification Required",
          description: "Please enter the 6-digit verification code sent to your verified phone number.",
        });
      } else {
        toast({
          title: "Welcome Back!",
          description: `Logged in as ${result.user?.name || identifier} (${result.user?.role}).`,
        });
        setLocation("/");
      }
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid username/email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode || smsCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await verifySmsCode(targetPhone, smsCode);
      toast({
        title: "2FA Verified!",
        description: "Entering dashboard...",
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThePotLiteAuthLayout
      activeStep={smsStep ? 2 : 1}
      tagline="Welcome Back 👋"
      headline="Access Your Pot"
      subheading="Manage youth sports obligations, payments, and approvals with non-custodial safety."
    >
      <div className="w-full max-w-[440px] mx-auto py-2 sm:py-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-[34px] font-bold text-slate-900 dark:text-white tracking-tight">
            {smsStep ? "Verify SMS 2FA" : "Welcome Back"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {smsStep
              ? "Enter the 6-digit verification code sent via Twilio SMS"
              : "Sign in with your username or email address"}
          </p>
        </div>

        {smsStep ? (
          /* SMS 2FA Step */
          <form onSubmit={handleVerifySms} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                6-Digit Verification Code
              </Label>
              <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <input
                  type="text"
                  maxLength={6}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full bg-transparent border-none text-center font-mono text-xl tracking-widest text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01]"
            >
              {loading ? "Verifying code..." : "Verify & Enter Dashboard"}
            </Button>

            <button
              type="button"
              onClick={() => setSmsStep(false)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline pt-1"
            >
              Back to login options
            </button>
          </form>
        ) : (
          /* Production Login Form (Username / Email & Password) */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Username or Email Input */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Username or Email
              </Label>
              <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 flex items-center gap-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter username or email address"
                  className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 font-medium"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </Label>
              </div>
              <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 flex items-center justify-between focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? "Signing in..." : "Continue"}
              </Button>
            </div>

            {/* Switch to Register link */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{" "}
              <Link href="/register" className="font-bold text-[#2563eb] dark:text-blue-400 hover:underline">
                Register
              </Link>
            </div>

            {/* Privacy Policy & Terms Disclaimer */}
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 leading-relaxed pt-3">
              By signing in I confirm that I carefully have read and agree to The Pot Limited{" "}
              <span className="underline cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</span> and{" "}
              <span className="underline cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</span>
            </p>
          </form>
        )}
      </div>
    </ThePotLiteAuthLayout>
  );
};
