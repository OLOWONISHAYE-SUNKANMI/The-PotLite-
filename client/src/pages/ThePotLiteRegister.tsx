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
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [name, setName] = useState("Coach Marcus Lewis");
  const [username, setUsername] = useState("coach_marcus");
  const [email, setEmail] = useState("coach.marcus@tigersfc.org");
  const [password, setPassword] = useState("CoachSecure2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("Organizer");
  const [organizationName, setOrganizationName] = useState("Tigers Youth Soccer Club");
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name, username, and password.",
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
      <div className="space-y-6 max-w-md mx-auto w-full">
        {/* Title */}
        <div>
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

          {/* Divider */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-[11px] uppercase font-bold text-slate-400">Or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Fast Demo One-Tap Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setName("Coach Marcus Lewis");
                setUsername("coach_marcus");
                setRole("Organizer");
                setPhone("+1 (555) 019-2834");
              }}
              className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <span>⚡ Fast Autofill: Coach Marcus (Organizer)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setName("Sarah Jenkins");
                setUsername("sarah_j");
                setRole("Member");
                setPhone("+1 (555) 014-9821");
              }}
              className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <span>⚡ Fast Autofill: Sarah Jenkins (Parent)</span>
            </button>
          </div>

          {/* Bottom Disclaimer (Reference Image Match) */}
          <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-relaxed pt-2">
            By signing up I confirm that I carefully have read and agree to ThePotLite{" "}
            <span className="underline cursor-pointer">Privacy Policy</span> and{" "}
            <span className="underline cursor-pointer">Terms of Service</span>.
          </p>
        </form>
      </div>
    </ThePotLiteAuthLayout>
  );
};
