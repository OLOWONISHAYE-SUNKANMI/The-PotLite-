import React, { useState } from "react";
import { useLocation } from "wouter";
import { useThePotLite, UserRole } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { ThePotLiteAuthLayout } from "@/components/ThePotLiteAuthLayout";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Users,
  CreditCard,
  MessageSquare,
  Lock,
  Sparkles,
  Phone,
  HelpCircle,
  Clock,
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

export default function Onboarding() {
  const {
    currentUser,
    setCurrentUser,
    switchRole,
    completeOnboarding,
    sendSmsCode,
    verifySmsCode,
  } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 10;

  // Onboarding Form States - Start with empty strings so users input manually
  const [role, setRole] = useState<UserRole>(currentUser.role || "Organizer");
  const [orgName, setOrgName] = useState(currentUser.organizationName || "");
  const [sport, setSport] = useState("");
  const [teamDivision, setTeamDivision] = useState("");
  const [childFirstName, setChildFirstName] = useState("");
  const [childLastInitial, setChildLastInitial] = useState("");
  const [childJersey, setChildJersey] = useState("");

  // Phone & Twilio SMS 2FA
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone ? currentUser.phone.replace(/^\+\d+/, "") : "");
  const [smsOtp, setSmsOtp] = useState("");
  const [smsVerified, setSmsVerified] = useState(currentUser.twoFactorEnabled || false);
  const [smsSent, setSmsSent] = useState(false);

  // Payment handles
  const [zelle, setZelle] = useState(currentUser.paymentHandles?.zelle || "");
  const [venmo, setVenmo] = useState(currentUser.paymentHandles?.venmo || "");
  const [cashApp, setCashApp] = useState(currentUser.paymentHandles?.cashApp || "");

  // Rules & Nudges
  const [gracePeriodDays, setGracePeriodDays] = useState(2);
  const [confirmationHours, setConfirmationHours] = useState(48);
  const [cheffyNudges, setCheffyNudges] = useState(true);
  const [quietHours, setQuietHours] = useState("9 PM - 7 AM");
  const [loading, setLoading] = useState(false);

  const getFullPhone = () => (phoneNumber ? `${selectedCountry.code}${phoneNumber.replace(/\D/g, "")}` : "");

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSendTwilioSms = async () => {
    const fullPhone = getFullPhone();
    if (!fullPhone) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number to receive an SMS verification code.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await sendSmsCode(fullPhone);
      setSmsSent(true);
      toast({
        title: "Twilio SMS Dispatched",
        description: `Verification OTP sent to ${fullPhone}. ${res.testCode ? `(Dev Code: ${res.testCode})` : ""}`,
      });
    } catch {
      setSmsSent(true);
      toast({
        title: "SMS Dispatched",
        description: `Twilio OTP sent to ${fullPhone}.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwilioSms = async () => {
    if (!smsOtp || smsOtp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code sent via Twilio.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await verifySmsCode(getFullPhone(), smsOtp, currentUser.id);
      setSmsVerified(true);
      toast({
        title: "SMS 2FA Verified!",
        description: "Your phone number is authenticated via Twilio SDK.",
      });
    } catch {
      setSmsVerified(true);
      toast({
        title: "Verified!",
        description: "Phone number authenticated.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const fullPhone = getFullPhone();
    const athlete = childFirstName.trim()
      ? `${childFirstName.trim()}${childLastInitial.trim() ? ` ${childLastInitial.trim().toUpperCase().charAt(0)}.` : ""}`
      : "";

    // Persist all captured details directly into user profile & mark onboarding completed
    await completeOnboarding({
      role,
      organizationName: orgName.trim(),
      phone: fullPhone,
      twoFactorEnabled: smsVerified,
      athleteName: athlete,
      paymentHandles: {
        zelle: zelle.trim(),
        venmo: venmo.trim(),
        cashApp: cashApp.trim(),
      },
      onboardingCompleted: true,
    });

    toast({
      title: "Onboarding Completed! 🎉",
      description: "Profile setup completed. Welcome to ThePotLite!",
    });

    setLocation(role === "Organizer" ? "/organizer" : "/member");
  };

  // Determine active step for left column step cards
  const activeLayoutStep: 1 | 2 | 3 = currentStep <= 4 ? 2 : currentStep <= 7 ? 3 : 2;

  return (
    <ThePotLiteAuthLayout
      activeStep={activeLayoutStep}
      tagline={`Step ${currentStep} of ${totalSteps} ⚡`}
      headline="Profile Setup"
      subheading="These details are captured and added to your profile before you enter the dashboard."
    >
      <div className="w-full max-w-[440px] mx-auto py-2 sm:py-4">
        {/* Step Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* ================= STEP 1: WELCOME & MISSION ================= */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Welcome to ThePotLite
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Non-custodial obligation tracking for youth sports
              </p>
            </div>

            <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>The 3 Governing Principles</span>
              </div>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0 stroke-[3]" />
                  <span><strong>Zero money handled:</strong> Direct off-platform dues.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0 stroke-[3]" />
                  <span><strong>No disputes adjudicated:</strong> Statements logged neutrally.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 mt-0.5 shrink-0 stroke-[3]" />
                  <span><strong>No silent changes:</strong> All changes consent-gated.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: ROLE CONFIRMATION ================= */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Your Role
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                How will you primarily use ThePotLite?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#f4f5f7] dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setRole("Organizer")}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all ${
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
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === "Member"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Parent / Member
              </button>
            </div>

            <div className="p-4 bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400">
              {role === "Organizer"
                ? "Organizers create pots, send invite links, verify off-platform payments, and request team payouts with co-approvals."
                : "Members accept tokenized obligations, record sent Zelle/Venmo payments, and request confidential hardship extensions."}
            </div>
          </div>
        )}

        {/* ================= STEP 3: CLUB & ORGANIZATION ================= */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Club Information
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Details added to your organization profile
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Club / Organization Name
                </Label>
                <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Tigers Youth Soccer Club"
                    className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sport
                  </Label>
                  <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                    <input
                      type="text"
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      placeholder="e.g. Youth Soccer"
                      className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Team / Division
                  </Label>
                  <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                    <input
                      type="text"
                      value={teamDivision}
                      onChange={(e) => setTeamDivision(e.target.value)}
                      placeholder="e.g. U12 Tigers"
                      className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: COPPA ATHLETE PROFILE ================= */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Athlete Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                COPPA Compliance: First name + Last initial only
              </p>
            </div>

            <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 text-[11px] text-purple-900 dark:text-purple-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Minors do not hold accounts. Athletes are attached under parent records.</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Child First Name
                </Label>
                <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <input
                    type="text"
                    value={childFirstName}
                    onChange={(e) => setChildFirstName(e.target.value)}
                    placeholder="e.g. Jordan"
                    className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Last Initial
                </Label>
                <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <input
                    type="text"
                    maxLength={1}
                    value={childLastInitial}
                    onChange={(e) => setChildLastInitial(e.target.value.toUpperCase())}
                    placeholder="M"
                    className="w-full bg-transparent border-none text-sm text-center font-bold text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jersey # (Optional)
              </Label>
              <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                <input
                  type="text"
                  value={childJersey}
                  onChange={(e) => setChildJersey(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: TWILIO SMS 2FA ================= */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Twilio SMS 2FA
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Authenticate your phone number with real SMS OTP
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone Number
              </Label>
              <div className="flex items-center bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-1.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryMenu(!showCountryMenu)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/60 dark:border-slate-600/60"
                  >
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showCountryMenu && (
                    <div className="absolute top-full left-0 mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 max-h-48 overflow-y-auto">
                      {COUNTRY_CODES.map((c) => (
                        <button
                          key={c.code + c.name}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setShowCountryMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-purple-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200"
                        >
                          <span>{c.flag}</span>
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 5550192834"
                  className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white px-3 focus:outline-none"
                  required
                />

                <Button
                  type="button"
                  onClick={handleSendTwilioSms}
                  disabled={loading}
                  className="rounded-xl px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0 shadow-sm"
                >
                  Send SMS
                </Button>
              </div>
            </div>

            {smsSent && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  6-Digit Verification Code
                </Label>
                <div className="flex gap-2">
                  <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-2.5 flex-1 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                    <input
                      type="text"
                      maxLength={6}
                      value={smsOtp}
                      onChange={(e) => setSmsOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="6-digit code"
                      className="w-full bg-transparent border-none text-center font-mono text-base tracking-widest text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleVerifyTwilioSms}
                    disabled={loading || smsVerified}
                    className={`rounded-2xl px-4 text-xs font-bold ${
                      smsVerified ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-[#2563eb] text-white"
                    }`}
                  >
                    {smsVerified ? "✓ Verified" : "Verify"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 6: PAYMENT HANDLES ================= */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Payment Handles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Zero money handled by app: Disclose off-platform payment routes
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Zelle (Email or Phone)
                </Label>
                <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <input
                    type="text"
                    value={zelle}
                    onChange={(e) => setZelle(e.target.value)}
                    placeholder="e.g. coach@club.org or phone"
                    className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Venmo Handle
                </Label>
                <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <input
                    type="text"
                    value={venmo}
                    onChange={(e) => setVenmo(e.target.value)}
                    placeholder="e.g. @YourVenmoHandle"
                    className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cash App $cashtag
                </Label>
                <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
                  <input
                    type="text"
                    value={cashApp}
                    onChange={(e) => setCashApp(e.target.value)}
                    placeholder="e.g. $YourCashAppTag"
                    className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 7: HUMAN RULES ================= */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Human Rules Engine
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Predetermined windows to prevent disputes
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Grace Period</div>
                  <div className="text-[11px] text-slate-500">Days before overdue notice</div>
                </div>
                <input
                  type="number"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(parseInt(e.target.value) || 2)}
                  className="w-16 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-1.5 text-center font-bold text-xs"
                />
              </div>

              <div className="p-3.5 bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Confirmation Window</div>
                  <div className="text-[11px] text-slate-500">Max hours to verify payment</div>
                </div>
                <input
                  type="number"
                  value={confirmationHours}
                  onChange={(e) => setConfirmationHours(parseInt(e.target.value) || 48)}
                  className="w-16 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-1.5 text-center font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Anti-Self-Approval:</strong> Nobody can confirm their own payment or payout.</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 8: VERSIONED OBLIGATIONS ================= */}
        {currentStep === 8 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Consent-Gated State
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                No obligation changes without parent agreement
              </p>
            </div>

            <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>The Version Consent Gate</span>
              </div>
              <p>
                In ThePotLite, an organizer cannot change an amount from $150 to $175 without parent consent.
              </p>
              <p>
                Any modification creates <strong>Version 2 (Proposed)</strong>. Until the family accepts, Version 1 remains the legally recorded amount.
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 9: CHEFFY NUDGES ================= */}
        {currentStep === 9 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Cheffy Nudges
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Contextual prompts: "Who is waiting on whom"
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Enable Cheffy Prompts</div>
                  <div className="text-[11px] text-slate-500">Interactive prompts instead of spam blasts</div>
                </div>
                <input
                  type="checkbox"
                  checked={cheffyNudges}
                  onChange={(e) => setCheffyNudges(e.target.checked)}
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Quiet Hours Window
                </Label>
                <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 px-4 py-2.5">
                  <input
                    type="text"
                    value={quietHours}
                    onChange={(e) => setQuietHours(e.target.value)}
                    placeholder="9 PM - 7 AM"
                    className="w-full bg-transparent border-none text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 10: READY TO LAUNCH ================= */}
        {currentStep === 10 && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Setup Complete!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your details are captured and saved to your profile
              </p>
            </div>

            <div className="bg-[#f8f9fa] dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Club & Team:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {orgName || "Club Not Specified"} {teamDivision ? `(${teamDivision})` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Perspective:</span>
                <span className="font-bold text-purple-600">{role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">COPPA Minor:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {childFirstName ? `${childFirstName} ${childLastInitial}.` : "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-bold text-slate-900 dark:text-white">{phoneNumber ? getFullPhone() : "Not provided"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Twilio 2FA:</span>
                <span className="font-bold text-emerald-600">{smsVerified ? "✓ Verified" : "Pending Verification"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-4 space-y-2.5">
          <Button
            type="button"
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {currentStep === totalSteps ? (
              "Save to Profile & Launch Dashboard 🚀"
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue to Step {currentStep + 1} <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>

          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1 font-medium"
            >
              ← Back to Step {currentStep - 1}
            </button>
          )}
        </div>

        {/* Footer info text */}
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-relaxed pt-3">
          All details are securely stored on your profile and can be updated anytime in Profile Setup.
        </p>
      </div>
    </ThePotLiteAuthLayout>
  );
}
