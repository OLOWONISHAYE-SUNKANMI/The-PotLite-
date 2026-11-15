import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  Copy,
  ArrowUpRight,
  MoreHorizontal,
  Check,
  X,
  Sparkles,
  Send,
  HelpCircle,
  Receipt,
  Calendar,
  CheckCircle2,
  Building2,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const ThePotLiteMemberDashboard: React.FC = () => {
  const { toast } = useToast();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<"USD" | "Jordan M." | "U12 Boys">("Jordan M.");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [assistanceModalOpen, setAssistanceModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("100.00");
  const [paymentMethod, setPaymentMethod] = useState("Zelle");
  const [paymentNote, setPaymentNote] = useState("");
  const [assistanceType, setAssistanceType] = useState<"more_time" | "financial_help">("more_time");
  const [assistanceVisibility, setAssistanceVisibility] = useState<"organizers_only" | "organizers_and_group">("organizers_only");

  // Cheffy interactive prompt state
  const [activePrompt, setActivePrompt] = useState<{
    text: string;
    amount: string;
    dueDate: string;
  } | null>({
    text: "Your $100.00 installment is due in 3 days. Where do you stand?",
    amount: "$100.00",
    dueDate: "Nov 18, 2026",
  });

  const handlePromptGreen = () => {
    setActivePrompt(null);
    toast({
      title: "On Track Recorded",
      description: "Cheffy logged your intent as On Track. Reminders will stay on schedule.",
    });
  };

  const handlePromptYellow = () => {
    setActivePrompt(null);
    setAssistanceModalOpen(true);
  };

  const handlePromptRed = () => {
    setActivePrompt(null);
    toast({
      title: "Exit Request Initiated",
      description: "Cheffy notified the coach and organizers.",
    });
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentModalOpen(false);
    toast({
      title: "Payment Recorded",
      description: `Marked sent $${paymentAmount} via ${paymentMethod}. Pending organizer confirmation.`,
    });
  };

  const handleSubmitAssistance = (e: React.FormEvent) => {
    e.preventDefault();
    setAssistanceModalOpen(false);
    toast({
      title: "Assistance Request Submitted",
      description: `Confidential request routed to organizers.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          TOP ROW: 2 CARDS (Hero Obligation Balance + Purple Priority Cheffy Card)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hero Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            {/* Top Row: Pills & Account Number */}
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setActiveTab("Jordan M.")}
                  className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                    activeTab === "Jordan M." ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  👦 Jordan M.
                </button>
                <button
                  onClick={() => setActiveTab("U12 Boys")}
                  className={`px-3 py-1 rounded-full transition-all ${
                    activeTab === "U12 Boys" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  U12 Boys
                </button>
                <button
                  onClick={() => setActiveTab("USD")}
                  className={`px-3 py-1 rounded-full transition-all ${
                    activeTab === "USD" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  USD
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Family Account
                </span>
                <span className="text-xs font-bold text-slate-800">
                  FAM-JENKINS-42
                </span>
              </div>
            </div>

            {/* Label & Amount */}
            <div className="pt-2">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Total Remaining Obligation
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  {balanceVisible ? "$100.00" : "••••••••••"}
                </span>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>$400.00 confirmed of $500.00 season commitments · Next due Nov 18</span>
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#1b3d2f] hover:bg-[#142e23] text-emerald-300 font-semibold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark Payment Sent</span>
              </button>

              <button
                onClick={() => setAssistanceModalOpen(true)}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>Request Help (Yellow)</span>
              </button>

              <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setPaymentModalOpen(true)}
              className="w-12 h-12 rounded-full bg-[#a3e635] hover:bg-[#8ece28] text-slate-900 flex items-center justify-center shadow-lg shadow-[#a3e635]/30 transition-transform hover:scale-105"
            >
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Right Accent Card: Cheffy Priority (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#a3e635] via-[#8ece28] to-[#65a30d] text-slate-950 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 w-48 h-48 opacity-15 pointer-events-none select-none">
            <svg viewBox="0 0 200 200" fill="currentColor">
              <polygon points="100,10 120,80 190,100 120,120 100,190 80,120 10,100 80,80" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between pb-4">
              <div className="inline-flex items-center gap-1.5 bg-slate-950 text-white font-bold text-xs px-3 py-1.5 rounded-full">
                <span>CHEFFY PROMPT</span>
                <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[11px] font-extrabold">
                  !
                </span>
              </div>
              <button className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-slate-900 hover:bg-black/20">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-1">
              <span className="text-xs font-semibold text-slate-800/80 block mb-1">
                Due in 3 Days (Part #2)
              </span>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                  $100.00
                </span>
                <span className="bg-white/80 text-slate-900 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Due Nov 18
                </span>
              </div>
            </div>
          </div>

          {/* Interactive One-Tap Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-6">
            <button
              onClick={handlePromptGreen}
              className="bg-slate-950 hover:bg-slate-900 text-emerald-400 font-bold text-xs py-2.5 px-2 rounded-2xl shadow-sm text-center transition-transform hover:scale-102 flex flex-col items-center"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 mb-1"></span>
              On Track
            </button>
            <button
              onClick={handlePromptYellow}
              className="bg-white hover:bg-slate-50 text-amber-700 font-bold text-xs py-2.5 px-2 rounded-2xl shadow-sm text-center transition-transform hover:scale-102 flex flex-col items-center"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 mb-1"></span>
              Need Help
            </button>
            <button
              onClick={handlePromptRed}
              className="bg-white/80 hover:bg-white text-rose-700 font-bold text-xs py-2.5 px-2 rounded-2xl shadow-sm text-center transition-transform hover:scale-102 flex flex-col items-center"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 mb-1"></span>
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ROW: 3 CARDS (Progress Donut, Milestone Bars, Payments History)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Card 1: Obligation Donut (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-bold text-slate-900">Obligation Progress</span>
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                Season 2026
              </span>
            </div>

            <div className="relative flex flex-col items-center justify-center py-5">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" className="stroke-slate-100" strokeWidth="10" fill="transparent" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="stroke-[#a3e635]"
                  strokeWidth="10"
                  strokeDasharray="301.6"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-900">$400.00</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-0.5">
                  80% Paid
                </span>
              </div>
            </div>

            <div className="text-center pb-2">
              <p className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1">
                <span>✦ Next installment:</span>
                <span className="text-purple-600 font-bold">$100.00 (Due Nov 18)</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
              <span>Paid: <strong className="text-slate-900">$400.00</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
              <span>Remaining: $100.00</span>
            </div>
          </div>
        </div>

        {/* Card 2: Installment Milestones (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-bold text-slate-900">Installment Schedule</span>
              <span className="text-xs font-bold text-[#e1683d] bg-[#fbf2ed] px-2.5 py-1 rounded-full border-b-2 border-[#e1683d]">
                2 Parts
              </span>
            </div>

            <div className="py-2">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight block">
                State Cup Travel
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Terms Version 1 · Consent Confirmed
              </span>
            </div>

            <div className="space-y-4 pt-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-900 font-bold">Part #1 (Paid)</span>
                  <span className="text-slate-900 font-bold">$100.00</span>
                </div>
                <div className="relative w-full bg-slate-100 rounded-full h-3 flex items-center">
                  <div className="bg-[#a3e635] h-3 rounded-full w-full"></div>
                  <span className="absolute right-2 text-[9px] font-black text-slate-950">
                    Confirmed
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600 font-semibold">Part #2 (Due Nov 18)</span>
                  <span className="text-slate-600 font-semibold">$100.00</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-400 h-2 rounded-full w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Activity & Receipts (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-bold text-slate-900">Recent Statements</span>
              <button className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Part #1 Confirmed via Zelle</p>
                    <p className="text-[10px] text-slate-400">Oct 15, 2026 · Confirmed by Coach</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">+$100.00</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Season Dues Part #2</p>
                    <p className="text-[10px] text-slate-400">Sep 28, 2026 · Paid via Venmo</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">+$150.00</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-700">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">State Cup Entry Paid Out</p>
                    <p className="text-[10px] text-slate-400">Team Disbursement · Verified</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Payment Sent Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="bg-white rounded-3xl border border-slate-200 text-slate-900 sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Mark Payment Sent</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              ThePotLite does not process funds. Send your payment directly using Cash App, Zelle, Venmo, Cash, or Check, then record it here. The organizer will confirm receipt.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Amount Sent ($)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 rounded-xl text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Payment Method</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 mt-1"
              >
                <option value="Zelle">Zelle</option>
                <option value="Venmo">Venmo</option>
                <option value="Cash App">Cash App</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="other app">Other App</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Optional Reference / Note</Label>
              <Input
                placeholder="Confirmation # or note"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="bg-slate-50 border-slate-200 rounded-xl text-sm mt-1"
              />
            </div>
            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#1b3d2f] hover:bg-[#142e23] text-emerald-300 font-semibold rounded-full">
                Submit Statement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assistance Modal */}
      <Dialog open={assistanceModalOpen} onOpenChange={setAssistanceModalOpen}>
        <DialogContent className="bg-white rounded-3xl border border-slate-200 text-slate-900 sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Request Assistance (Yellow Path)</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              No shaming. You control who learns about your situation. All requests are confidential by default.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAssistance} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">What do you need?</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="needType"
                    checked={assistanceType === "more_time"}
                    onChange={() => setAssistanceType("more_time")}
                  />
                  More Time (Extension)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="needType"
                    checked={assistanceType === "financial_help"}
                    onChange={() => setAssistanceType("financial_help")}
                  />
                  Financial Help
                </label>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Who may see this request?</Label>
              <div className="space-y-1.5 mt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={assistanceVisibility === "organizers_only"}
                    onChange={() => setAssistanceVisibility("organizers_only")}
                  />
                  Organizers Only (Recommended · Confidential)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={assistanceVisibility === "organizers_and_group"}
                    onChange={() => setAssistanceVisibility("organizers_and_group")}
                  />
                  Organizers + Team Group
                </label>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setAssistanceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full">
                Send Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
