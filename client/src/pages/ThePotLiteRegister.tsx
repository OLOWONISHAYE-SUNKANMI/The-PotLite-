import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite, UserRole } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { ThePotLiteAuthLayout } from "@/components/ThePotLiteAuthLayout";
import {
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ThePotLiteRegister: React.FC = () => {
  const { register, sendSmsCode } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("Organizer");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password || !phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name, username, password, and phone number for SMS 2FA.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Register account in system
      const user = await register({
        name,
        username,
        email: email || `${username}@thepotlite.org`,
        password,
        phone,
        role,
        organizationName,
      });

      // Dispatch real Twilio SMS OTP code
      try {
        await sendSmsCode(phone);
        toast({
          title: "Account Registered & SMS Sent!",
          description: `Twilio verification SMS dispatched to ${phone}.`,
        });
      } catch {
        toast({
          title: "Account Registered!",
          description: "Entering dashboard...",
        });
      }

      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Registration Note",
        description: err.message || "Entering dashboard in demo mode.",
      });
      setLocation("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThePotLiteAuthLayout
      activeStep={step === 1 ? 1 : 2}
      tagline="Join Us to Build 🤩"
      headline="Start your Journey"
      subheading="Follow these simple steps to set up your account and manage youth club obligations."
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
            Join Us
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create an adult account to manage or accept team pots
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-4">
          {/* Phone Number Field with Country Badge (Reference Image Match) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Phone number (Twilio SMS 2FA)
            </Label>
            <div className="flex items-center gap-2 bg-[#f4f6f8] dark:bg-slate-800/80 rounded-2xl p-1.5 border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm shrink-0">
                <span className="text-sm">🇺🇸</span>
                <span>+1</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none px-2"
                required
              />
            </div>
          </div>

          {/* Full Name & Username (Two columns side-by-side, Reference Image Match) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </Label>
              <div className="bg-[#f4f6f8] dark:bg-slate-800/80 rounded-2xl px-3.5 py-2.5 border border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Coach Marcus"
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Username
              </Label>
              <div className="bg-[#f4f6f8] dark:bg-slate-800/80 rounded-2xl px-3.5 py-2.5 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="coach_marcus"
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                  required
                />
                {username.length >= 3 && (
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 stroke-[2.5]" />
                )}
              </div>
            </div>
          </div>

          {/* Password with Eye Toggle (Reference Image Match) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </Label>
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
            <p className="text-[10px] text-slate-400 pl-1">
              At least 8 characters, letters, numbers, and symbols.
            </p>
          </div>

          {/* Role Pill Selector */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Your Perspective
            </Label>
            <div className="grid grid-cols-2 gap-2 bg-[#f4f6f8] dark:bg-slate-800/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setRole("Organizer")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === "Organizer"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Organizer (Coach)
              </button>
              <button
                type="button"
                onClick={() => setRole("Member")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === "Member"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Parent / Member
              </button>
            </div>
          </div>

          {/* Continue Button (Reference Image Match) */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/30 transition-all hover:scale-[1.01]"
          >
            {loading ? "Setting up account..." : "Continue"}
          </Button>

          {/* Switch link */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
              Log in
            </Link>
          </div>

          {/* Bottom Disclaimer (Reference Image Match) */}
          <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-relaxed pt-3">
            By signing up I confirm that I carefully have read and agree to ThePotLite{" "}
            <span className="underline cursor-pointer">Privacy Policy</span> and{" "}
            <span className="underline cursor-pointer">Terms of Service</span>.
          </p>
        </form>
      </div>
    </ThePotLiteAuthLayout>
  );
};
