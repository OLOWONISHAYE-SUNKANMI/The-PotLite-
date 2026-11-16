import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { ThePotLiteAuthLayout } from "@/components/ThePotLiteAuthLayout";
import {
  Eye,
  EyeOff,
  Check,
  ChevronDown,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const COUNTRY_CODES = [
  { flag: "🇺🇸", code: "+1", name: "United States" },
  { flag: "🇦🇲", code: "+374", name: "Armenia" },
  { flag: "🇬🇧", code: "+44", name: "United Kingdom" },
  { flag: "🇨🇦", code: "+1", name: "Canada" },
  { flag: "🇦🇺", code: "+61", name: "Australia" },
  { flag: "🇩🇪", code: "+49", name: "Germany" },
  { flag: "🇫🇷", code: "+33", name: "France" },
  { flag: "🇳🇬", code: "+234", name: "Nigeria" },
];

export const ThePotLiteLogin: React.FC = () => {
  const {
    login,
    verifySmsCode,
    sendSmsCode,
  } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"phone" | "username">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [smsStep, setSmsStep] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetPhone, setTargetPhone] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = loginMethod === "phone"
      ? `${selectedCountry.code}${phoneNumber.replace(/\D/g, "")}`
      : usernameOrEmail.trim();

    if (!identifier || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your login credentials and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const fullPhone = loginMethod === "phone" ? identifier : undefined;
      const result = await login({
        usernameOrEmail: identifier,
        password,
        phone: fullPhone,
      });

      if (result.requiresTwoFactor) {
        setTargetPhone(fullPhone || result.challenge?.phone || "");
        setSmsStep(true);
        try {
          const smsRes = await sendSmsCode(fullPhone || "");
          toast({
            title: "Twilio SMS Dispatched",
            description: `Verification SMS sent. ${smsRes.testCode ? `(Code: ${smsRes.testCode})` : ""}`,
          });
        } catch {
          toast({
            title: "2FA Verification Required",
            description: "Please enter the 6-digit verification code sent to your phone.",
          });
        }
      } else {
        toast({
          title: "Welcome Back!",
          description: `Logged in as ${result.user?.name || identifier}.`,
        });
        setLocation("/");
      }
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials. Please verify your details or use quick demo sign-in below.",
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

  const handleQuickDemo = (role: "organizer" | "member") => {
    if (role === "organizer") {
      setLoginMethod("username");
      setUsernameOrEmail("coach_marcus");
      setPassword("Password123!");
    } else {
      setLoginMethod("username");
      setUsernameOrEmail("sarah_j");
      setPassword("Password123!");
    }
    toast({
      title: "Demo Credentials Filled",
      description: `Ready to sign in as ${role === "organizer" ? "Coach Marcus" : "Sarah Jenkins"}. Click Continue!`,
    });
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
              ? "Enter the 6-digit code sent via Twilio SMS"
              : "Sign in to access your team pots and obligations"}
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
          /* Normal Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Input Mode Toggle: Phone vs Username */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {loginMethod === "phone" ? "Phone number" : "Username or Email"}
              </Label>
              <button
                type="button"
                onClick={() => setLoginMethod(loginMethod === "phone" ? "username" : "phone")}
                className="text-[11px] font-semibold text-[#2563eb] dark:text-blue-400 hover:underline"
              >
                {loginMethod === "phone" ? "Use username instead" : "Use phone number instead"}
              </button>
            </div>

            {loginMethod === "phone" ? (
              /* Phone number with Flag and Country Code (Matches Reference Image) */
              <div className="relative">
                <div className="flex items-center bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-1.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryMenu(!showCountryMenu)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/60 dark:border-slate-600/60 hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-base">{selectedCountry.flag}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedCountry.code}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showCountryMenu && (
                      <div className="absolute top-full left-0 mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 max-h-56 overflow-y-auto">
                        {COUNTRY_CODES.map((c) => (
                          <button
                            key={c.code + c.name}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setShowCountryMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            <span className="text-base">{c.flag}</span>
                            <span className="font-medium flex-1 truncate">{c.name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0000 00 00"
                    className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white px-3 focus:outline-none placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>
              </div>
            ) : (
              /* Username or Email Input */
              <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="coach_marcus or coach@thepotlite.org"
                  className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 font-medium"
                  required
                />
              </div>
            )}

            {/* Password Field with Eye Toggle */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 flex items-center justify-between focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 font-medium"
                  required
                />
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

            {/* Or Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700/80" />
              </div>
              <div className="relative px-3 bg-white dark:bg-[#0c101c] text-[12px] font-medium text-slate-400">
                Or
              </div>
            </div>

            {/* 1-Click Quick Demo Sign-Ins */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                Quick Demo Access
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("organizer")}
                  className="px-3 py-2.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/60 dark:bg-purple-950/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all text-center"
                >
                  Coach Marcus (Organizer)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("member")}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all text-center"
                >
                  Sarah Jenkins (Parent)
                </button>
              </div>
            </div>

            {/* Privacy Policy & Terms Disclaimer */}
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 leading-relaxed pt-2">
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
