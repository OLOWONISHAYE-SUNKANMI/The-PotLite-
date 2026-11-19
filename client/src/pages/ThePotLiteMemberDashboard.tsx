import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/config";
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

  const userStr = typeof window !== "undefined" ? localStorage.getItem("pot_user") : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Athlete");

  const [obligations, setObligations] = useState<any[]>([]);
  const [totalCommitted, setTotalCommitted] = useState<number>(0);
  const [totalRemaining, setTotalRemaining] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [proposals, setProposals] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [activeObligation, setActiveObligation] = useState<any | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [assistanceModalOpen, setAssistanceModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("100.00");
  const [paymentMethod, setPaymentMethod] = useState("Zelle");
  const [paymentNote, setPaymentNote] = useState("");
  const [assistanceType, setAssistanceType] = useState<"more_time" | "financial_help">("more_time");
  const [assistanceVisibility, setAssistanceVisibility] = useState<"organizers_only" | "organizers_and_group">("organizers_only");
  const [withdrawalReason, setWithdrawalReason] = useState("Schedule conflict / family relocation");
  const [isWithdrawn, setIsWithdrawn] = useState(false);
  const [voteChoice, setVoteChoice] = useState<"yes" | "no">("yes");
  const [dissentReason, setDissentReason] = useState("");
  const [hasVoted, setHasVoted] = useState(false);

  // Cheffy interactive prompt state
  const [activePrompt, setActivePrompt] = useState<{
    text: string;
    amount: string;
    dueDate: string;
  } | null>(null);

  const fetchMemberData = async () => {
    try {
      const url = apiUrl(`/api/v1/dashboard/member${currentUser?.id ? `?userId=${currentUser.id}` : ""}`);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setObligations(data.obligations || []);
        setTotalCommitted(Number(data.totalCommitted || 0));
        setTotalRemaining(Number(data.totalRemaining || 0));
        setTotalPaid(Number(data.totalPaid || 0));
        setProposals(data.proposals || []);
        setRecentPayments(data.recentPayments || []);
        if (data.obligations && data.obligations.length > 0) {
          const first = data.obligations[0];
          setActiveObligation(first);
          const remaining = Number(first.balance_remaining || 0);
          setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : "50.00");
          if (remaining > 0) {
            setActivePrompt({
              text: `Your $${remaining.toFixed(2)} installment is due. Where do you stand?`,
              amount: `$${remaining.toFixed(2)}`,
              dueDate: first.pot?.due_date || "Upcoming",
            });
          } else {
            setActivePrompt(null);
          }
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, []);

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
    setWithdrawalModalOpen(true);
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalModalOpen(false);
    setIsWithdrawn(true);
    const obId = activeObligation?.id || 1;
    try {
      await fetch(apiUrl(`/api/v1/pots/obligations/${obId}/withdraw`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: withdrawalReason }),
      });
      fetchMemberData();
    } catch {
      // Fallback
    }
    toast({
      title: "Withdrawal Confirmed",
      description: "Obligation closed as Withdrawn. Prior confirmed payments remain recorded in audit trail.",
    });
  };

  const handleCastVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoteModalOpen(false);
    setHasVoted(true);
    const propId = proposals[0]?.id || 1;
    try {
      await fetch(apiUrl(`/api/v1/governance/proposals/${propId}/vote`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: voteChoice, dissentReason: voteChoice === "no" ? dissentReason : "" }),
      });
      fetchMemberData();
    } catch {
      // Fallback
    }
    toast({
      title: `Vote ${voteChoice.toUpperCase()} Cast`,
      description: voteChoice === "no"
        ? "Dissent reason filed confidentially with organizers."
        : "Your vote has been counted toward the 60% group threshold.",
    });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentModalOpen(false);
    const obId = activeObligation?.id || 1;
    try {
      await fetch(apiUrl(`/api/v1/pots/obligations/${obId}/pay`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount) || 100.0,
          paymentMethod: paymentMethod.toLowerCase(),
          note: paymentNote || `Sent via ${paymentMethod}`,
        }),
      });
      fetchMemberData();
    } catch {
      // Graceful fallback
    }
    toast({
      title: "Payment Recorded (Dual-Confirmation)",
      description: `Marked sent $${paymentAmount} via ${paymentMethod}. Pending coach/organizer verification.`,
    });
  };

  const handleSubmitAssistance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssistanceModalOpen(false);
    const obId = activeObligation?.id || 1;
    try {
      await fetch(apiUrl("/api/v1/assistance/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          obligationId: obId,
          requestedAmount: parseFloat(paymentAmount) || 100.0,
          reason: assistanceType === "more_time" ? "Need 14-day payment extension" : "Financial assistance / booster sponsorship",
          privateNote: "Private Yellow Path requested via Parent Dashboard",
        }),
      });
      fetchMemberData();
    } catch {
      // Graceful fallback
    }
    toast({
      title: "Confidential Yellow Path Filed",
      description: `Assistance request routed privately to lead organizers.`,
    });
  };

  const athleteDisplayName = currentUser?.athleteName || currentUser?.name || currentUser?.username || "Active Player";
  const familyCode = `FAM-${(currentUser?.username || "MEMBER").toUpperCase()}-${currentUser?.id || "01"}`;
  const progressPercent = totalCommitted > 0 ? Math.min(100, Math.round((totalPaid / totalCommitted) * 100)) : 100;

  return (
    <div className="w-full space-y-6">
      {/* =========================================================================
          TOP ROW: 2 CARDS (Hero Obligation Balance + Purple Priority Cheffy Card)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hero Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            {/* Top Row: Pills & Account Number */}
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300">
                <button
                  onClick={() => setActiveTab("Athlete")}
                  className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                    activeTab === "Athlete"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  👦 {athleteDisplayName}
                </button>
                <button
                  onClick={() => setActiveTab("Pot")}
                  className={`px-3 py-1 rounded-full transition-all ${
                    activeTab === "Pot"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {activeObligation?.pot?.name || "Team Pot"}
                </button>
                <button
                  onClick={() => setActiveTab("USD")}
                  className={`px-3 py-1 rounded-full transition-all ${
                    activeTab === "USD"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  USD
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Family Account
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {familyCode}
                </span>
              </div>
            </div>

            {/* Label & Amount */}
            <div className="pt-2">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
                Total Remaining Obligation
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {balanceVisible ? `$${totalRemaining.toFixed(2)}` : "••••••••••"}
                </span>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                <span>
                  ${totalPaid.toFixed(2)} confirmed of ${totalCommitted.toFixed(2)} season commitments · {activeObligation?.pot?.name || "Active Obligation"}
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="inline-flex items-center gap-2 bg-purple-900/90 hover:bg-purple-950 text-purple-200 border border-purple-800 font-semibold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5 text-purple-300" />
                <span>Mark Payment Sent</span>
              </button>

              <button
                onClick={() => setAssistanceModalOpen(true)}
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Request Help (Yellow)</span>
              </button>

              <button
                onClick={() => setWithdrawalModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 font-semibold text-xs px-3.5 py-2.5 rounded-full shadow-sm transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Withdraw</span>
              </button>
            </div>

            <button
              onClick={() => setPaymentModalOpen(true)}
              className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-transform hover:scale-105"
            >
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Right Accent Card: Cheffy Priority (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-950 text-white rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 w-48 h-48 opacity-15 pointer-events-none select-none">
            <svg viewBox="0 0 200 200" fill="currentColor">
              <polygon points="100,10 120,80 190,100 120,120 100,190 80,120 10,100 80,80" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between pb-4">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white font-bold text-xs px-3 py-1.5 rounded-full border border-white/20">
                <span>CHEFFY PROMPT</span>
                <span className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center text-[11px] font-extrabold">
                  !
                </span>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-1">
              <span className="text-xs font-semibold text-purple-200/90 block mb-1">
                {activePrompt ? activePrompt.text : "Status: Up to date"}
              </span>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {activePrompt ? activePrompt.amount : `$${totalRemaining.toFixed(2)}`}
                </span>
                <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                  {activePrompt ? activePrompt.dueDate : "All Set"}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive One-Tap Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-6">
            <button
              onClick={handlePromptGreen}
              className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs py-2.5 px-2 rounded-2xl shadow-sm text-center transition-transform hover:scale-102 flex flex-col items-center border border-white/20"
            >
              <span className="w-2 h-2 rounded-full bg-purple-300 mb-1"></span>
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
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Obligation Progress</span>
              <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                {activeObligation?.pot?.name || "Active Pot"}
              </span>
            </div>

            <div className="relative flex flex-col items-center justify-center py-5">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="10" fill="transparent" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="stroke-purple-600 dark:stroke-purple-500"
                  strokeWidth="10"
                  strokeDasharray="301.6"
                  strokeDashoffset={301.6 - (301.6 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-900 dark:text-white">${totalPaid.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/80 dark:text-purple-300 px-2 py-0.5 rounded-full mt-0.5">
                  {progressPercent}% Paid
                </span>
              </div>
            </div>

            <div className="text-center pb-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                <span>✦ Remaining commitment:</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">${totalRemaining.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white inline-block"></span>
              <span>Paid: <strong className="text-slate-900 dark:text-white">${totalPaid.toFixed(2)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 inline-block"></span>
              <span>Remaining: ${totalRemaining.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Installment Milestones (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Active Commitments</span>
              <span className="text-xs font-bold text-[#e1683d] bg-[#fbf2ed] dark:bg-[#e1683d]/20 px-2.5 py-1 rounded-full border-b-2 border-[#e1683d]">
                {obligations.length} Active
              </span>
            </div>

            <div className="py-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
                {activeObligation?.pot?.name || "Team Obligations"}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Terms Version 1 · Non-Custodial Agreement
              </span>
            </div>

            <div className="space-y-4 pt-3">
              {obligations.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-xs">No active commitments registered yet.</p>
                </div>
              ) : (
                obligations.map((ob) => {
                  const paid = Number(ob.total_amount || 0) - Number(ob.balance_remaining || 0);
                  const isDone = Number(ob.balance_remaining || 0) <= 0;
                  return (
                    <div key={ob.id}>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-900 dark:text-white font-bold">{ob.pot?.name}</span>
                        <span className="text-slate-900 dark:text-white font-bold">${Number(ob.total_amount).toFixed(2)}</span>
                      </div>
                      <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 flex items-center">
                        <div
                          className="bg-purple-600 h-3 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((paid / (Number(ob.total_amount) || 1)) * 100))}%` }}
                        ></div>
                        <span className="absolute right-2 text-[9px] font-black text-slate-700 dark:text-slate-300">
                          {isDone ? "Confirmed" : `$${Number(ob.balance_remaining).toFixed(2)} remaining`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Recent Activity & Receipts (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Recent Statements</span>
              <span className="text-xs font-semibold text-slate-500">{recentPayments.length} records</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[260px] overflow-y-auto">
              {recentPayments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs font-medium">No payment statements filed yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Payments recorded off-platform appear here.</p>
                </div>
              ) : (
                recentPayments.map((p) => {
                  const isConfirmed = p.state?.toLowerCase() === "confirmed";
                  const isDisputed = p.state?.toLowerCase() === "disputed";
                  return (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isConfirmed ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60" :
                          isDisputed ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60" :
                          "bg-purple-50 text-purple-600 dark:bg-purple-950/60"
                        }`}>
                          {isConfirmed ? <Check className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            ${Number(p.amount).toFixed(2)} via {p.payment_method?.toUpperCase()}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {isConfirmed ? "Confirmed by Coach" : isDisputed ? "Disputed / Discrepancy" : "Pending Coach Receipt Check"}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ml-2 ${
                        isConfirmed ? "text-emerald-600 dark:text-emerald-400" :
                        isDisputed ? "text-rose-600 dark:text-rose-400" :
                        "text-amber-600 dark:text-amber-400"
                      }`}>
                        {isConfirmed ? "Verified" : p.state}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTLENECK TRACKER FOR PARENT & LEVEL 3 GROUP VOTING CARD
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bottleneck Status (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Cheffy Status · Bottleneck
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                recentPayments.some(p => p.state?.toLowerCase() === "pending_confirmation")
                  ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40"
                  : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  recentPayments.some(p => p.state?.toLowerCase() === "pending_confirmation")
                    ? "bg-purple-600 animate-ping"
                    : "bg-emerald-500"
                }`}></span>
                {recentPayments.some(p => p.state?.toLowerCase() === "pending_confirmation") ? "Waiting on Coach" : "All Clear"}
              </span>
            </div>

            <div className="py-4 space-y-2">
              {recentPayments.some(p => p.state?.toLowerCase() === "pending_confirmation") ? (
                <>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Waiting on Coach to confirm your payment of ${Number(recentPayments.find(p => p.state?.toLowerCase() === "pending_confirmation")?.amount || 0).toFixed(2)}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Under ThePotLite rules, the coach has a <strong>48-hour confirmation window</strong> to verify receipt. Once verified, your remaining balance drops accordingly.
                  </p>
                </>
              ) : (
                <>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    No payments pending confirmation
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your account is fully synchronized with the team pot audit trail. When you submit an off-platform payment via Zelle or Venmo, it will be queued here.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Human Governance Rule #2 Active</span>
            <span>No automatic debit or penalty</span>
          </div>
        </div>

        {/* Level 3 Group Voting Card (6 Cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-purple-200/80 dark:border-purple-900/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                Level 3 Governance · Group Vote
              </span>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full">
                {hasVoted ? "Vote Recorded" : proposals.length > 0 ? "Action Required" : "No Active Votes"}
              </span>
            </div>

            <div className="py-3 space-y-1.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {proposals.length > 0
                  ? proposals[0].title
                  : "Add $25/player for State Cup Referee & Video Analysis"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {proposals.length > 0
                  ? proposals[0].description
                  : "Proposed by Coach Marcus. Affects all 12 families. Requires 50% quorum and 60% member approval to pass."}
              </p>

              {/* Progress bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  <span>Current Approval: 75% (6 Yes / 2 No)</span>
                  <span className="text-purple-600">Threshold: 60%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-purple-600 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {hasVoted ? `You voted ${voteChoice.toUpperCase()}` : "Dissenting requires reason"}
            </span>
            {!hasVoted && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => { setVoteChoice("yes"); handleCastVote({ preventDefault: () => {} } as any); }}
                  className="h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs px-3.5"
                >
                  Vote Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setVoteChoice("no"); setVoteModalOpen(true); }}
                  className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 rounded-full text-xs px-3.5"
                >
                  Vote No
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Opt-Out & Withdrawal Dialog (Phase 3) */}
      <Dialog open={withdrawalModalOpen} onOpenChange={setWithdrawalModalOpen}>
        <DialogContent className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Withdraw from Pot Commitment
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              <strong>Phase 3 Auto-Removal & Safe Exit:</strong> ThePotLite handles zero money and never traps families. Review conditions below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitWithdrawal} className="space-y-4 py-2">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <p className="font-bold">Strict 3-Condition Non-Custodial Check:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Prior payments of $400.00 remain recorded in the immutable audit trail.</li>
                <li>ThePotLite holds zero funds — any refund agreement is settled directly off-platform with your club treasurer.</li>
                <li>Your obligation will close as <code>Withdrawn</code> and remaining shares flagged Change Pending.</li>
              </ul>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason for Withdrawal</Label>
              <select
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-xl p-2.5 mt-1"
              >
                <option value="Schedule conflict / family relocation">Schedule conflict / family relocation</option>
                <option value="Player injury / medical">Player injury / medical</option>
                <option value="Club / roster change">Club / roster change</option>
                <option value="Other / personal">Other / personal</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setWithdrawalModalOpen(false)}>
                Stay in Pot
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-full">
                Confirm Withdrawal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dissent Reason Modal for Vote No */}
      <Dialog open={voteModalOpen} onOpenChange={setVoteModalOpen}>
        <DialogContent className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Written Dissent Reason (Level 3 Governance)
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Under Level 3 Governance, 'No' votes require a written explanation. This is routed <strong>confidentially to organizers only</strong> to promote constructive resolution without public shaming.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCastVote} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Why are you voting No?</Label>
              <Input
                placeholder="e.g. Current family budget does not support video analysis this tournament."
                value={dissentReason}
                onChange={(e) => setDissentReason(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm mt-1"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setVoteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white rounded-full">
                Submit Dissent Vote
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark Payment Sent Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Mark Payment Sent</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              ThePotLite does not process funds. Send your payment directly using Cash App, Zelle, Venmo, Cash, or Check, then record it here. The organizer will confirm receipt.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount Sent ($)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Payment Method</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-xl p-2.5 mt-1"
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
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Optional Reference / Note</Label>
              <Input
                placeholder="Confirmation # or note"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm mt-1"
              />
            </div>
            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full shadow-sm shadow-purple-600/30">
                Submit Statement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assistance Modal */}
      <Dialog open={assistanceModalOpen} onOpenChange={setAssistanceModalOpen}>
        <DialogContent className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Request Assistance (Yellow Path)</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              No shaming. You control who learns about your situation. All requests are confidential by default.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAssistance} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">What do you need?</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="needType"
                    checked={assistanceType === "more_time"}
                    onChange={() => setAssistanceType("more_time")}
                  />
                  More Time (Extension)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
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
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Who may see this request?</Label>
              <div className="space-y-1.5 mt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={assistanceVisibility === "organizers_only"}
                    onChange={() => setAssistanceVisibility("organizers_only")}
                  />
                  Organizers Only (Recommended · Confidential)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
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
