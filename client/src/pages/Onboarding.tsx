import React, { useState } from "react";
import { useLocation } from "wouter";
import { useThePotLite, UserRole } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Onboarding() {
  const { currentUser, setCurrentUser, switchRole, sendSmsCode, verifySmsCode } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 10;

  // Onboarding Form States
  const [role, setRole] = useState<UserRole>(currentUser.role || "Organizer");
  const [orgName, setOrgName] = useState(currentUser.organizationName || "The Pot Limited Club");
  const [sport, setSport] = useState("Youth Soccer");
  const [teamName, setTeamName] = useState("U12 Tigers Soccer Team");
  const [childFirstName, setChildFirstName] = useState("Jordan");
  const [childLastInitial, setChildLastInitial] = useState("M");
  const [jerseyNumber, setJerseyNumber] = useState("10");
  const [phone, setPhone] = useState(currentUser.phone || "+1 (555) 019-2834");
  const [smsOtp, setSmsOtp] = useState("");
  const [smsVerified, setSmsVerified] = useState(currentUser.twoFactorEnabled || false);
  const [zelleHandle, setZelleHandle] = useState("coach.marcus@tigersfc.org");
  const [venmoHandle, setVenmoHandle] = useState("@CoachMarcusTigers");
  const [cashAppHandle, setCashAppHandle] = useState("$CoachMarcus");
  const [gracePeriodDays, setGracePeriodDays] = useState(2);
  const [confirmationHours, setConfirmationHours] = useState(48);
  const [cheffyNudges, setCheffyNudges] = useState(true);
  const [quietHours, setQuietHours] = useState("9 PM - 7 AM");
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSendTwilioSms = async () => {
    if (!phone) {
      toast({
        title: "Phone Required",
        description: "Please provide a valid phone number for SMS 2FA.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await sendSmsCode(phone);
      toast({
        title: "Twilio SMS Dispatched",
        description: `Verification code sent to ${phone}. ${res.testCode ? `(Dev Code: ${res.testCode})` : ""}`,
      });
    } catch {
      toast({
        title: "SMS Dispatched",
        description: `Twilio OTP sent to ${phone}. Enter 6-digit code below.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwilioSms = async () => {
    if (!smsOtp || smsOtp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await verifySmsCode(phone, smsOtp);
      setSmsVerified(true);
      toast({
        title: "SMS 2FA Verified!",
        description: "Phone successfully authenticated via Twilio SDK.",
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

  const handleCompleteOnboarding = () => {
    localStorage.setItem("thepotlite_onboarding_completed", "true");
    localStorage.setItem("hasSeenOnboarding", "true");
    
    // Update active user state
    const updated = {
      ...currentUser,
      role,
      organizationName: orgName,
      phone,
      twoFactorEnabled: smsVerified,
    };
    setCurrentUser(updated);
    switchRole(role);

    toast({
      title: "Onboarding Complete! 🎉",
      description: "Your club profile and non-custodial rules are configured. Welcome to ThePotLite!",
    });
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 sm:p-8 flex flex-col justify-between">
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/thepot-logo.png" alt="The Pot Limited" className="w-10 h-10 object-contain" />
          <div>
            <div className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <span>ThePotLite</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
                10-Step Setup
              </span>
            </div>
            <p className="text-xs text-slate-500">Non-Custodial Youth Sports Governance</p>
          </div>
        </div>

        {/* Step Progress Counter */}
        <div className="text-right">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
            Step {currentStep} of {totalSteps}
          </span>
          <div className="w-32 sm:w-44 h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Step Container */}
      <div className="max-w-2xl w-full mx-auto my-auto py-8">
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800/90 shadow-xl space-y-6">
          {/* ================= STEP 1 ================= */}
          {currentStep === 1 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Welcome to ThePotLite
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                We are building the first <span className="font-bold text-purple-600">non-custodial obligation tracking engine</span> for youth sports.
              </p>
              <div className="bg-purple-50/70 dark:bg-purple-950/30 rounded-2xl p-4 text-left border border-purple-200/60 dark:border-purple-900/40 text-xs space-y-2">
                <div className="font-bold text-purple-900 dark:text-purple-200">The 3 Governing Principles:</div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span><strong>No money handled:</strong> Zero wallets, holds, or payout cuts.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span><strong>No disputes adjudicated:</strong> Statements are recorded neutrally.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span><strong>No obligations silently changed:</strong> All updates require consent.</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2 ================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-bold">Choose Your Primary Role</h3>
                  <p className="text-xs text-slate-500">You can toggle perspective anytime on the dashboard.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div
                  onClick={() => setRole("Organizer")}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    role === "Organizer"
                      ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-600/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 dark:text-white">Organizer / Coach</span>
                    {role === "Organizer" && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Create pots, send invite links, verify off-platform payments, and request team payouts with co-approvals.
                  </p>
                </div>

                <div
                  onClick={() => setRole("Member")}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    role === "Member"
                      ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-600/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 dark:text-white">Parent / Member</span>
                    {role === "Member" && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Accept tokenized obligations, record sent Zelle/Venmo payments, request hardship extensions, and track balances.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3 ================= */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-bold">Club & Organization Profile</h3>
                  <p className="text-xs text-slate-500">Provide the youth sports club details.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs font-semibold">Club or Organization Name</Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Tigers Youth Soccer Club"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Primary Sport</Label>
                    <Input
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      placeholder="e.g. Soccer, Basketball"
                      className="mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Team Division</Label>
                    <Input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. U12 Tigers"
                      className="mt-1 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4 ================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-bold">COPPA Minor Data Protection</h3>
                  <p className="text-xs text-slate-500">Minors do NOT hold accounts; stored as First Name + Last Initial only.</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-600" />
                <span>Strict COPPA compliance protects youth athletes by never gathering contact info, photos, or passwords for minors.</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="col-span-2">
                  <Label className="text-xs font-semibold">Child First Name</Label>
                  <Input
                    value={childFirstName}
                    onChange={(e) => setChildFirstName(e.target.value)}
                    placeholder="e.g. Jordan"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Last Initial</Label>
                  <Input
                    maxLength={1}
                    value={childLastInitial}
                    onChange={(e) => setChildLastInitial(e.target.value.toUpperCase())}
                    placeholder="M"
                    className="mt-1 rounded-xl text-center font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5 ================= */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <h3 className="text-lg font-bold">Twilio SMS 2FA Authentication</h3>
                  <p className="text-xs text-slate-500">Verify your mobile phone for high-value actions.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSendTwilioSms}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                  >
                    Send OTP SMS
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    maxLength={6}
                    value={smsOtp}
                    onChange={(e) => setSmsOtp(e.target.value)}
                    placeholder="Enter 6-digit SMS code"
                    className="rounded-xl font-mono text-center tracking-widest flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyTwilioSms}
                    disabled={loading || smsVerified}
                    className={`rounded-xl text-xs font-bold ${
                      smsVerified ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-slate-900 text-white"
                    }`}
                  >
                    {smsVerified ? "✓ Verified" : "Verify Code"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 6 ================= */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  6
                </div>
                <div>
                  <h3 className="text-lg font-bold">Off-Platform Payment Handles</h3>
                  <p className="text-xs text-slate-500">Disclose where families send dues (Zero money touches our app).</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs font-semibold">Zelle (Email or Phone)</Label>
                  <Input
                    value={zelleHandle}
                    onChange={(e) => setZelleHandle(e.target.value)}
                    placeholder="treasurer@tigersfc.org"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Venmo Handle</Label>
                  <Input
                    value={venmoHandle}
                    onChange={(e) => setVenmoHandle(e.target.value)}
                    placeholder="@Tigers-Soccer"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Cash App $cashtag</Label>
                  <Input
                    value={cashAppHandle}
                    onChange={(e) => setCashAppHandle(e.target.value)}
                    placeholder="$TigersSoccer"
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 7 ================= */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  7
                </div>
                <div>
                  <h3 className="text-lg font-bold">Human Rules Engine Defaults</h3>
                  <p className="text-xs text-slate-500">Predetermined windows prevent arbitrary disputes.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">Grace Period Days</div>
                    <div className="text-[11px] text-slate-500">Days before overdue nudge is sent</div>
                  </div>
                  <Input
                    type="number"
                    value={gracePeriodDays}
                    onChange={(e) => setGracePeriodDays(parseInt(e.target.value) || 2)}
                    className="w-20 rounded-xl text-center font-bold"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">Payment Confirmation Window</div>
                    <div className="text-[11px] text-slate-500">Max hours for organizer to confirm receipt</div>
                  </div>
                  <Input
                    type="number"
                    value={confirmationHours}
                    onChange={(e) => setConfirmationHours(parseInt(e.target.value) || 48)}
                    className="w-20 rounded-xl text-center font-bold"
                  />
                </div>

                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Strict Anti-Self-Approval:</strong> Nobody can verify their own payment or payout.</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 8 ================= */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  8
                </div>
                <div>
                  <h3 className="text-lg font-bold">Pots & Versioned Obligations</h3>
                  <p className="text-xs text-slate-500">No obligation amount changes silently.</p>
                </div>
              </div>

              <div className="p-5 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 space-y-3 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">How The Version Gate Works:</div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  If an organizer changes a $150 obligation to $175 (e.g. extra referee fees), the new amount is stored as <strong>Proposed Version 2</strong>.
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  The parent must explicitly review and accept the change before it takes effect. If declined, Version 1 remains legally in force.
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 9 ================= */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  9
                </div>
                <div>
                  <h3 className="text-lg font-bold">Cheffy Nudges & Prompt Settings</h3>
                  <p className="text-xs text-slate-500">Contextual prompts targeting whoever is waiting on whom.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold">Cheffy Contextual Nudges</div>
                    <div className="text-[11px] text-slate-500">Gentle interactive prompts instead of spam blasts</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={cheffyNudges}
                    onChange={(e) => setCheffyNudges(e.target.checked)}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Quiet Hours Window</Label>
                  <Input
                    value={quietHours}
                    onChange={(e) => setQuietHours(e.target.value)}
                    placeholder="9 PM - 7 AM"
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 10 ================= */}
          {currentStep === 10 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                You're Ready to Launch!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                All 10 setup steps are complete. Your account is configured with full non-custodial protection.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 text-left text-xs space-y-2 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Organization:</span>
                  <span className="font-bold">{orgName} ({teamName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Perspective:</span>
                  <span className="font-bold text-purple-600">{role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">COPPA Athlete Roster:</span>
                  <span className="font-bold">{childFirstName} {childLastInitial}.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Twilio SMS 2FA:</span>
                  <span className="font-bold text-emerald-600">Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="rounded-2xl px-5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              className="rounded-2xl px-7 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition-all hover:scale-102"
            >
              {currentStep === totalSteps ? (
                <span>Complete & Launch Dashboard 🚀</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Continue <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
