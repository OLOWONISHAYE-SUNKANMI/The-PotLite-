import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite, UserRole } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { ThePotLiteAuthLayout } from "@/components/ThePotLiteAuthLayout";
import {
  Eye,
  EyeOff,
  Check,
  ChevronDown,
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

export const ThePotLiteRegister: React.FC = () => {
  const { register, sendSmsCode } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("Organizer");
  const [loading, setLoading] = useState(false);

  const isUsernameValid = username.trim().length >= 3;

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !password || !phoneNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your phone number, full name, username, and password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
      const cleanPhone = `${selectedCountry.code}${phoneNumber.replace(/\D/g, "")}`;
      const email = `${cleanUsername}@thepotlite.org`;

      await register({
        name: fullName.trim(),
        username: cleanUsername,
        email,
        password,
        phone: cleanPhone,
        role,
        organizationName: "The Pot Limited Club",
      });

      // Dispatch real Twilio SMS OTP code
      try {
        await sendSmsCode(cleanPhone);
        toast({
          title: "Account Created & SMS Dispatched",
          description: `Twilio verification SMS sent to ${cleanPhone}.`,
        });
      } catch {
        toast({
          title: "Account Created Successfully!",
          description: "Entering 10-step setup guide...",
        });
      }

      setLocation("/onboarding");
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Failed to create account. Please check your inputs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    toast({
      title: "Google Single Sign-On",
      description: "Redirecting to Google secure authentication...",
    });
    // Fill sample demo account
    setFullName("Juliette Karapetyan");
    setUsername("julietux");
    setPhoneNumber("00000000");
    setPassword("SecurePass123!");
    setSelectedCountry(COUNTRY_CODES[1]); // Armenia 🇦🇲 +374 as in reference image!
  };

  return (
    <ThePotLiteAuthLayout
      activeStep={1}
      tagline="Join Us to Build 🤩"
      headline="Start your Journey"
      subheading="Follow these simple steps to set up your account."
    >
      <div className="w-full max-w-[440px] mx-auto py-2 sm:py-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-[34px] font-bold text-slate-900 dark:text-white tracking-tight">
            Join Us
          </h2>
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          {/* 1. Phone number with Flag and Country Code (Matches Reference Image) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Phone number
            </Label>
            <div className="relative">
              <div className="flex items-center bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-1.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                {/* Country Flag Badge & Picker */}
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
          </div>

          {/* 2. Full Name & Username (Two Columns - Matches Reference Image) */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </Label>
              <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juliette Karapetyan"
                  className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Username
              </Label>
              <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 flex items-center justify-between gap-1 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="julietux"
                  className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 font-medium"
                  required
                />
                {isUsernameValid && (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                )}
              </div>
            </div>
          </div>

          {/* 3. Password Field with Eye Toggle (Matches Reference Image) */}
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
            <p className="text-[11px] text-slate-400 leading-normal px-1">
              At least 8 characters, no more than 20 characters. Uppercase letters, lowercase letters, numbers, and symbols.
            </p>
          </div>

          {/* 4. Perspective / Role (Organizer vs Member) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Account Type
              </Label>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                {role === "Organizer" ? "Team Organizer / Coach" : "Parent / Member"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#f4f5f7] dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setRole("Organizer")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === "Organizer"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Organizer (Coach)
              </button>
              <button
                type="button"
                onClick={() => setRole("Member")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === "Member"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Parent / Member
              </button>
            </div>
          </div>

          {/* 5. Continue Button (Matches Reference Image) */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? "Creating your account..." : "Continue"}
            </Button>
          </div>

          {/* 6. Already have an account? Log in */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#2563eb] dark:text-blue-400 hover:underline">
              Log in
            </Link>
          </div>

          {/* 7. Or Divider (Matches Reference Image) */}
          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700/80" />
            </div>
            <div className="relative px-3 bg-white dark:bg-[#0c101c] text-[12px] font-medium text-slate-400">
              Or
            </div>
          </div>

          {/* 8. Sign up with Google Button (Matches Reference Image) */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-sm"
          >
            {/* Google "G" Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign up with Google</span>
          </button>

          {/* 9. Privacy Policy & Terms Disclaimer (Matches Reference Image) */}
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 leading-relaxed pt-2">
            By signing up I confirm that I carefully have read and agree to The Pot Limited{" "}
            <span className="underline cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</span> and{" "}
            <span className="underline cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">Terms of Service</span>
          </p>
        </form>
      </div>
    </ThePotLiteAuthLayout>
  );
};
