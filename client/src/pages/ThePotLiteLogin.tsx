import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { ThePotLiteAuthLayout } from "@/components/ThePotLiteAuthLayout";
import {
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ThePotLiteLogin: React.FC = () => {
  const {
    login,
    verifyTwoFactor,
    verifySmsCode,
    sendSmsCode,
    twoFactorChallenge,
    setTwoFactorChallenge,
  } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

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
      const result = await login({ usernameOrEmail, password, phone });
      if (result.requiresTwoFactor) {
        // Automatically dispatch SMS via Twilio for 2FA
        try {
          const smsResult = await sendSmsCode(phone);
          toast({
            title: "Twilio SMS Dispatched",
            description: `Verification code sent to ${phone}. ${
              smsResult.testCode ? `(Dev Code: ${smsResult.testCode})` : ""
            }`,
          });
        } catch {
          toast({
            title: "Two-Factor Required",
            description: "Please enter your 6-digit verification code.",
          });
        }
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
        description: err.message || "Invalid credentials. Try quick demo sign-in below.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode || smsCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First try Twilio SMS verification
      try {
        await verifySmsCode(phone, smsCode, twoFactorChallenge?.userId);
        toast({
          title: "Twilio SMS 2FA Verified!",
          description: "Entering dashboard...",
        });
        setLocation("/");
        return;
      } catch {
        // Fallback to TOTP verification
        const user = await verifyTwoFactor(smsCode);
        toast({
          title: "2FA Verified!",
          description: `Welcome, ${user.name}! Entering dashboard...`,
        });
        setLocation("/");
      }
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

  const handleResendSMS = async () => {
    setResending(true);
    try {
      const res = await sendSmsCode(phone);
      toast({
        title: "Twilio SMS Resent!",
        description: `New code sent to ${phone}. ${res.testCode ? `(Code: ${res.testCode})` : ""}`,
      });
    } catch (err: any) {
      toast({
        title: "Resend Notice",
        description: "SMS verification code resent.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <ThePotLiteAuthLayout
      activeStep={twoFactorChallenge ? 3 : 1}
      tagline="Youth Sports Accountability ⚽"
      headline="Welcome Back"
      subheading="Sign in to access your club pots, track obligations, and review verified transactions."
    >
      <div className="space-y-6 w-full">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <img src="/thepot-logo.png" alt="The Pot Limited" className="w-8 h-8 object-contain" />
            <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              The Pot Limited
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {twoFactorChallenge ? "Twilio SMS 2FA" : "Sign In"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {twoFactorChallenge
              ? `We sent a 6-digit verification code to ${phone}`
              : "Enter your account details to access the dashboard"}
          </p>
        </div>

        {twoFactorChallenge ? (
          /* Twilio SMS 2FA Challenge Form */
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                <span className="font-bold block mb-0.5">Twilio SMS Two-Factor Active</span>
                Enter the 6-digit SMS code sent to your registered phone number.
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                6-Digit Verification Code
              </Label>
              <div className="bg-[#f4f6f8] dark:bg-slate-800/80 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  maxLength={6}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full bg-transparent border-none text-2xl font-black text-center tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                Enter the 6-digit code received on your mobile device.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResendSMS}
                disabled={resending}
                className="flex-1 py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                <span>Resend SMS</span>
              </button>
              <button
                type="button"
                onClick={() => setTwoFactorChallenge(null)}
                className="py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/30 transition-all hover:scale-[1.01]"
            >
              {loading ? "Verifying SMS Code..." : "Verify & Enter Dashboard"}
            </Button>
          </form>
        ) : (
          /* Normal Sign In Form */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Username or Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Username or Email
              </Label>
              <div className="bg-[#f4f6f8] dark:bg-slate-800/80 rounded-2xl px-3.5 py-2.5 border border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="coach_marcus or email@example.com"
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Password with Eye Toggle */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="bg-[#f4f6f8] dark:bg-slate-800/80 rounded-2xl px-3.5 py-2.5 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Continue Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/30 transition-all hover:scale-[1.01]"
            >
              {loading ? "Signing in..." : "Continue to Dashboard"}
            </Button>

            {/* Switch to Register link */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
              Don't have an account yet?{" "}
              <Link href="/register" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
                Join Us
              </Link>
            </div>

            {/* Bottom Disclaimer */}
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-relaxed pt-3">
              By signing in you agree to ThePotLite Non-Custodial Governance & Terms of Service.
            </p>
          </form>
        )}
      </div>
    </ThePotLiteAuthLayout>
  );
};
