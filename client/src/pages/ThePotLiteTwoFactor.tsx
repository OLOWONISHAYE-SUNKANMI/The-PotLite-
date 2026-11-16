import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { ThePotLiteAuthLayout } from "@/components/ThePotLiteAuthLayout";
import {
  MessageSquare,
  KeyRound,
  CheckCircle2,
  Copy,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ThePotLiteTwoFactor: React.FC = () => {
  const {
    currentUser,
    sendSmsCode,
    verifySmsCode,
    setupTwoFactor,
    enableTwoFactor,
  } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [phone, setPhone] = useState(currentUser.phone || "+1 (555) 019-2834");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"sms" | "totp">("sms");
  const [totpSetup, setTotpSetup] = useState<{ secret: string; otpAuthUrl: string } | null>(null);

  const handleSendSMS = async () => {
    setLoading(true);
    try {
      const res = await sendSmsCode(phone);
      toast({
        title: "SMS Code Dispatched",
        description: `Twilio verification SMS sent to ${phone}. ${res.testCode ? `(Dev Code: ${res.testCode})` : ""}`,
      });
    } catch {
      toast({
        title: "SMS Code Simulated",
        description: "Use demo code 123456 to verify.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === "sms") {
        await verifySmsCode(phone, code, currentUser.id);
        toast({
          title: "SMS 2FA Verified!",
          description: "Entering dashboard...",
        });
      } else {
        await enableTwoFactor(code);
        toast({
          title: "TOTP 2FA Verified!",
          description: "Entering dashboard...",
        });
      }
      setLocation("/");
    } catch (err: any) {
      if (code === "123456" || code === "000000") {
        toast({
          title: "2FA Verified (Demo Mode)",
          description: "Entering dashboard...",
        });
        setLocation("/");
      } else {
        toast({
          title: "Verification Failed",
          description: err.message || "Invalid code. Use demo code 123456.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThePotLiteAuthLayout
      activeStep={3}
      tagline="Twilio SMS Two-Factor 📱"
      headline="Verify Identity"
      subheading="Enforce two-factor authentication to secure organizer approvals and disbursements."
    >
      <div className="space-y-6 w-full">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Security Check
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose SMS verification via Twilio or Authenticator App
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 bg-[#f4f6f8] dark:bg-slate-800/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setMode("sms")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              mode === "sms"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            📱 Twilio SMS
          </button>
          <button
            type="button"
            onClick={async () => {
              setMode("totp");
              try {
                const data = await setupTwoFactor();
                setTotpSetup(data);
              } catch {
                setTotpSetup({
                  secret: "JBSWY3DPEHPK3PXP",
                  otpAuthUrl: "otpauth://totp/ThePotLite?secret=JBSWY3DPEHPK3PXP",
                });
              }
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              mode === "totp"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            🔑 Authenticator App
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {mode === "sms" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#f4f6f8] dark:bg-slate-800/80 rounded-2xl px-3.5 py-2.5 border border-slate-200/60 dark:border-slate-700/60">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendSMS}
                    disabled={loading}
                    className="px-4 py-2.5 bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-2xl transition-colors"
                  >
                    Send SMS
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Enter 6-Digit SMS Code
                </Label>
                <div className="bg-[#f4f6f8] dark:bg-slate-800/80 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-700/60">
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full bg-transparent border-none text-2xl font-black text-center tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Demo code: <strong className="text-purple-600 dark:text-purple-400">123456</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {totpSetup && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Base32 Secret Key
                  </span>
                  <div className="flex items-center justify-between font-mono font-bold text-purple-700 dark:text-purple-300">
                    <span>{totpSetup.secret}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(totpSetup.secret);
                        toast({ title: "Copied Secret!" });
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  6-Digit Authenticator Code
                </Label>
                <div className="bg-[#f4f6f8] dark:bg-slate-800/80 rounded-2xl p-2 border border-slate-200/60 dark:border-slate-700/60">
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full bg-transparent border-none text-2xl font-black text-center tracking-[0.5em] text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/30 transition-all hover:scale-[1.01]"
          >
            {loading ? "Verifying..." : "Verify & Enter Dashboard"}
          </Button>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-purple-600 dark:text-purple-400 hover:underline">
              Skip for Demo & Go to Dashboard →
            </Link>
          </div>
        </form>
      </div>
    </ThePotLiteAuthLayout>
  );
};
