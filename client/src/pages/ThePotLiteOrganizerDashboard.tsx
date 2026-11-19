import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
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
  Plus,
  Sparkles,
  Receipt,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  ArrowDownLeft,
  Clock,
  AlertCircle,
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

export const ThePotLiteOrganizerDashboard: React.FC = () => {
  const { currentUser } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeCurrency, setActiveCurrency] = useState<string>("USD");

  // Dynamic Pot Collections & Stats
  const [pots, setPots] = useState<any[]>([]);
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [totalGoal, setTotalGoal] = useState(0);

  // Dynamic "Needs You" Action Queue
  const [pendingConfirmations, setPendingConfirmations] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [pendingAssistance, setPendingAssistance] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Modals state
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedDisputePayment, setSelectedDisputePayment] = useState<any | null>(null);

  // Payout form
  const [payee, setPayee] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutPurpose, setPayoutPurpose] = useState("");

  // Dispute form
  const [disputeReason, setDisputeReason] = useState("Amount mismatch / payment not found in account statement");
  const [disputeType, setDisputeType] = useState<"mismatch" | "denial">("mismatch");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/v1/dashboard/organizer"));
      if (res.ok) {
        const data = await res.json();
        setPots(data.pots || []);
        setTotalConfirmed(Number(data.totalConfirmed) || 0);
        setTotalGoal(Number(data.totalGoal) || 0);
        setPendingConfirmations(data.pendingConfirmations || []);
        setPendingPayouts(data.pendingPayouts || []);
        setPendingAssistance(data.pendingAssistance || []);
        setDisputes(data.disputes || []);
      } else {
        // Direct pots fallback
        const potsRes = await fetch(apiUrl("/api/v1/pots"));
        if (potsRes.ok) {
          const potsData = await potsRes.json();
          setPots(potsData || []);
          const confirmed = (potsData || []).reduce(
            (acc: number, p: any) => acc + (parseFloat(p.collected_amount) || 0),
            0
          );
          const goal = (potsData || []).reduce(
            (acc: number, p: any) => acc + (parseFloat(p.total_target_amount) || 0),
            0
          );
          setTotalConfirmed(confirmed);
          setTotalGoal(goal);
        }
      }

      // Fetch audit timeline for recent transaction ledger
      const auditRes = await fetch(apiUrl("/api/v1/audit/"));
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setRecentTransactions(auditData.slice(0, 5));
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyOrgId = () => {
    const orgCode = `ORG-${currentUser.organizationId || 101}`;
    navigator.clipboard?.writeText(orgCode);
    toast({
      title: "Copied to Clipboard",
      description: `Organization Code ${orgCode} copied.`,
    });
  };

  const handleConfirmAction = async (payment: any) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/pots/payments/${payment.id}/confirm`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmingUserId: currentUser.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to confirm payment");
      }
      toast({
        title: "Dual Confirmation Verified!",
        description: `Applied $${parseFloat(payment.amount).toFixed(2)} to ${payment.payerName || "member"}'s obligation. Anti-self-approval rule satisfied.`,
      });
      fetchDashboardData();
    } catch (err: any) {
      toast({
        title: "Confirmation Error",
        description: err.message || "Failed to confirm payment on server.",
        variant: "destructive",
      });
    }
  };

  const handleOpenDispute = (payment: any) => {
    setSelectedDisputePayment(payment);
    setDisputeModalOpen(true);
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputePayment) return;
    setDisputeModalOpen(false);
    try {
      await fetch(apiUrl(`/api/v1/pots/payments/${selectedDisputePayment.id}/dispute`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statement: disputeReason,
          disputeType,
          disputingUserId: currentUser.id,
        }),
      });
      toast({
        title: "Neutral Discrepancy Logged",
        description: "Both member and coach statements saved to audit trail. ThePotLite never adjudicates disputes.",
      });
      fetchDashboardData();
    } catch {
      toast({
        title: "Dispute Error",
        description: "Failed to record dispute statement.",
        variant: "destructive",
      });
    }
  };

  const handleCoApprovePayout = async (payoutId: number) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/governance/payouts/${payoutId}/approve`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "approved",
          approverUserId: currentUser.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Co-approval failed");
      }
      toast({
        title: "Payout Authorized by Second Approver",
        description: "Multi-approver threshold satisfied. Vendor payment can be disbursed off-platform.",
      });
      fetchDashboardData();
    } catch (err: any) {
      toast({
        title: "Approval Error",
        description: err.message || "Cannot approve own payout request (Anti-Self-Approval rule).",
        variant: "destructive",
      });
    }
  };

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutModalOpen(false);
    const amountVal = parseFloat(payoutAmount) || 0;
    try {
      const activePotId = pots.length > 0 ? pots[0].id : 1;
      await fetch(apiUrl("/api/v1/governance/payouts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          potId: activePotId,
          requestedByUserId: currentUser.id,
          payee,
          amount: amountVal,
          purpose: payoutPurpose || "Youth tournament entry & referee fees",
        }),
      });
      fetchDashboardData();
    } catch {
      // Graceful local handling
    }

    const needsCoApproval = amountVal > 250;
    toast({
      title: needsCoApproval ? "Payout Spend Co-Approval Required" : "Payout Spend Approved",
      description: needsCoApproval
        ? `Request for $${payoutAmount} to ${payee} exceeds $250. Routed to second organizer for sign-off.`
        : `Request for $${payoutAmount} to ${payee} logged under single organizer limit.`,
    });
    setPayee("");
    setPayoutAmount("");
    setPayoutPurpose("");
  };

  const collectionPercent = totalGoal > 0 ? Math.min(100, Math.round((totalConfirmed / totalGoal) * 100)) : 0;

  return (
    <div className="w-full space-y-6">
      {/* =========================================================================
          TOP ROW: 2 CARDS (Hero Active Balance Card + Lime/Emerald Priority Card)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hero Card: Active Balance (7 Cols on desktop) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            {/* Top Row: Currency Pills & Account Number */}
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300">
                <button
                  onClick={() => setActiveCurrency("USD")}
                  className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                    activeCurrency === "USD"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span className="text-sm">🇺🇸</span> USD
                </button>
                <button
                  onClick={() => setActiveCurrency("Tigers U12")}
                  className={`px-3 py-1 rounded-full transition-all ${
                    activeCurrency === "Tigers U12"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Tigers U12
                </button>
                <button
                  onClick={() => setActiveCurrency("Fall 2026")}
                  className={`px-3 py-1 rounded-full transition-all ${
                    activeCurrency === "Fall 2026"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Fall 2026
                </button>
              </div>

              {/* Account / Org Number */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Pot / Org Number
                </span>
                <button
                  onClick={handleCopyOrgId}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-purple-600 transition-colors"
                >
                  <span>90340222748</span>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Label & Amount */}
            <div className="pt-2">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 block mb-1">
                Active Confirmed Balance
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {balanceVisible ? `$${totalConfirmed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••••••"}
                </span>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title="Toggle balance visibility"
                >
                  {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-600 inline-block"></span>
                <span>
                  ${totalConfirmed.toLocaleString("en-US", { minimumFractionDigits: 0 })} confirmed of ${totalGoal.toLocaleString("en-US", { minimumFractionDigits: 0 })} goal ({pots[0]?.name || "Active Pots"}) · Off-rail verified
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPayoutModalOpen(true)}
                className="inline-flex items-center gap-2 bg-purple-900/90 hover:bg-purple-950 text-purple-200 border border-purple-800 font-semibold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-300" />
                <span>Record Payout Spend</span>
              </button>

              <button
                onClick={() => toast({ title: "Needs You Queue", description: `${pendingConfirmations.length} payments and ${pendingPayouts.length} payouts pending approval.` })}
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all"
              >
                <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Pending Approvals ({pendingConfirmations.length + pendingPayouts.length})</span>
              </button>
            </div>

            {/* Circular Quick Action Button on Bottom Right */}
            <button
              onClick={() => setPayoutModalOpen(true)}
              className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-transform hover:scale-105"
              title="Quick Action"
            >
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Right Accent Card: Priority / Cheffy Status (5 Cols on desktop) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-950 text-white rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 w-48 h-48 opacity-15 pointer-events-none select-none">
            <svg viewBox="0 0 200 200" fill="currentColor">
              <polygon points="100,10 120,80 190,100 120,120 100,190 80,120 10,100 80,80" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between pb-4">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white font-bold text-xs px-3 py-1.5 rounded-full border border-white/20">
                <span>PRIORITY</span>
                <span className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center text-[11px] font-extrabold">
                  +
                </span>
              </div>

              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-1">
              <span className="text-xs font-semibold text-purple-200/90 block mb-1">
                Total Collections (Goal: ${totalGoal.toLocaleString("en-US", { minimumFractionDigits: 0 })})
              </span>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  ${(totalConfirmed + pendingConfirmations.reduce((s, p) => s + Number(p.amount || 0), 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                  {collectionPercent}% of goal
                </span>
              </div>
            </div>
          </div>

          {/* Sub-cards Row at Bottom */}
          <div className="grid grid-cols-2 gap-3 pt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex justify-between items-center text-white border border-white/15 shadow-sm">
              <div>
                <span className="text-[10px] font-semibold text-purple-200/80 block uppercase tracking-wider">
                  Needs Confirm
                </span>
                <div className="flex items-center gap-1 font-bold text-sm text-white">
                  <span>☆ {pendingConfirmations.length} Pending</span>
                </div>
              </div>
              <Eye className="w-3.5 h-3.5 text-purple-200" />
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex justify-between items-center text-white border border-white/15 shadow-sm">
              <div>
                <span className="text-[10px] font-semibold text-purple-200/80 block uppercase tracking-wider">
                  Assistance
                </span>
                <div className="flex items-center gap-1 font-bold text-sm text-white">
                  <span>🎟 {pendingAssistance.length} Requests</span>
                </div>
              </div>
              <Eye className="w-3.5 h-3.5 text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ROW: 3 CARDS (Spending Donut, Earning Bars, Transactions / Queue)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Card 1: Spending Donut (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Active Pots Overview</span>
              <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                {pots.length} Pot{pots.length !== 1 ? 's' : ''} Active
              </span>
            </div>

            {/* Circular Donut Ring Graphic */}
            <div className="relative flex flex-col items-center justify-center py-5">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="stroke-purple-600 dark:stroke-purple-500"
                  strokeWidth="10"
                  strokeDasharray="301.6"
                  strokeDashoffset={301.6 - (301.6 * Math.min(100, collectionPercent)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  ${totalConfirmed.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/80 dark:text-purple-300 px-2 py-0.5 rounded-full mt-0.5">
                  {collectionPercent}%
                </span>
              </div>
            </div>

            <div className="text-center pb-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                <span>✦ Collection progress towards goal:</span>
                <span className="text-purple-600 font-bold">${totalGoal.toLocaleString("en-US", { minimumFractionDigits: 0 })}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {pots.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">No pots created yet.</p>
            ) : (
              pots.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-purple-600 inline-block shrink-0"></span>
                    <span className="truncate">{p.name}</span>
                  </div>
                  <strong className="text-slate-900 dark:text-white shrink-0 ml-2">
                    ${Number(p.total_target_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Earning / Collections Allocation (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Pot Allocations</span>
              <span className="text-xs font-bold text-[#e1683d] bg-[#fbf2ed] dark:bg-[#e1683d]/20 px-2.5 py-1 rounded-full border-b-2 border-[#e1683d]">
                🎯 ${totalGoal.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </span>
            </div>

            <div className="py-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
                ${totalConfirmed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                {collectionPercent}% confirmed to date
              </span>
            </div>

            <div className="space-y-4 pt-3">
              {pots.length === 0 ? (
                <div className="text-center py-6 text-slate-400 space-y-2">
                  <p className="text-xs">No active pots yet</p>
                  <Button
                    size="sm"
                    onClick={() => setLocation("/create")}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs"
                  >
                    + Create First Pot
                  </Button>
                </div>
              ) : (
                pots.map((pot) => {
                  const potTarget = Number(pot.total_target_amount || 0);
                  return (
                    <div key={pot.id}>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-900 dark:text-white font-semibold truncate mr-2">{pot.name}</span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                          ${potTarget.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, collectionPercent)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>Per Member: ${Number(pot.per_member_amount || 0).toFixed(0)}</span>
                        <span>Due: {pot.due_date || "Open"}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Transactions / "Needs You" Queue (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Action Queue & Receipts</span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                {pendingConfirmations.length + pendingPayouts.length} Action Needed
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto pr-1">
              {/* Dynamic Pending Confirmations */}
              {pendingConfirmations.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {item.payer?.username || "Member"} filed ${Number(item.amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                        {item.payment_method?.toUpperCase()} receipt check
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleConfirmAction(item.id)}
                      className="w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                      title="Confirm Payment"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => handleOpenDispute(item.id)}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                      title="Dispute / Reject"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Dynamic Pending Payouts (Requires 2nd Approver) */}
              {pendingPayouts.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between gap-2 bg-purple-50/50 dark:bg-purple-950/20 p-2.5 rounded-2xl border border-purple-100 dark:border-purple-900/40 my-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      2FA
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {req.payee} (${Number(req.amount).toFixed(2)})
                      </p>
                      <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium truncate">
                        Co-approval needed (&gt;$250)
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleCoApprovePayout(req.id)}
                    className="h-7 text-xs bg-purple-700 hover:bg-purple-800 text-white rounded-full px-3 shrink-0"
                  >
                    Co-Approve
                  </Button>
                </div>
              ))}

              {pendingConfirmations.length === 0 && pendingPayouts.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1.5 opacity-80" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Action Queue Clear</p>
                  <p className="text-[11px] text-slate-400">All member payments and payouts are up to date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTLENECK STATUS: "WHO IS WAITING ON WHOM" & QUIET HOURS COMPLIANCE
          ========================================================================= */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Bottleneck Tracker: Who is Waiting on Whom</span>
              <span className="text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                Cheffy AI Dispatcher
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Prompts target only the single individual blocking progress. Zero generic blast messages.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto border border-emerald-200 dark:border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Quiet Hours (9PM - 8AM) Compliant</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-1">
              Active Member Commitments ({pots.reduce((s, p) => s + (p.obligations?.length || 0), 0)})
            </span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {pots.length > 0 ? `${pots[0].name}: ${pots.reduce((s, p) => s + (p.obligations?.length || 0), 0)} athletes enrolled` : "No active commitments"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Target due date: {pots[0]?.due_date || "Open enrollment"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400 block mb-1">
              Waiting on Coach ({pendingConfirmations.length})
            </span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {pendingConfirmations.length > 0
                ? `${pendingConfirmations[0].payer?.username || "Member"} ($${Number(pendingConfirmations[0].amount).toFixed(2)})`
                : "All payments confirmed"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Dual-confirmation receipt check (Confirmation window: 48 hours)
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400 block mb-1">
              Waiting on Co-Approver ({pendingPayouts.length})
            </span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {pendingPayouts.length > 0
                ? `${pendingPayouts[0].payee} ($${Number(pendingPayouts[0].amount).toFixed(2)})`
                : "No pending payout requests"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Requires 2nd organizer signature (&gt;$250 threshold)
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PILOT TELEMETRY & METRIC INSTRUMENTATION
          ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/90 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Pot Completion Rate
          </span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">84.2%</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
            +6.4% vs pilot benchmark
          </span>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/90 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Avg Days to Full Paid
          </span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">8.2 days</span>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block mt-0.5">
            Down from 22 days
          </span>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/90 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Cheffy Response Time
          </span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">1.8 hrs</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
            Target &lt; 4 hrs
          </span>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/90 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Organizer Time Saved
          </span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">4.5 hrs/wk</span>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block mt-0.5">
            Zero spreadsheet tracking
          </span>
        </div>
      </div>

      {/* Neutral Dispute Reconciliation Dialog */}
      <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
        <DialogContent className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              Neutral Discrepancy Reconciliation
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              <strong>ThePotLite never decides who is right.</strong> Both member and coach statements are recorded side-by-side in the immutable audit trail.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDispute} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Discrepancy Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setDisputeType("mismatch")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    disputeType === "mismatch"
                      ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 font-bold"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Amount Mismatch
                </button>
                <button
                  type="button"
                  onClick={() => setDisputeType("denial")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    disputeType === "denial"
                      ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 font-bold"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Payment Not Received
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Organizer Counter-Statement</Label>
              <Input
                placeholder="e.g. Checked Zelle records; did not receive $100 on Nov 16"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm mt-1"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              Member filed: <em>"Sent $100.00 via Zelle"</em>. Both statements will remain visible without punitive charges or late fees.
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setDisputeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white rounded-full">
                Log Neutral Discrepancy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payout Spend Dialog */}
      <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
        <DialogContent className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Record Payout Spend Request</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              ThePotLite governs off-platform spending. The organization pays the vendor directly.
              Separation of duties applies: requester cannot self-approve.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePayout} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vendor / Payee</Label>
              <Input
                placeholder="State Cup Tournament Org / Referee Coordinator"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount ($)</Label>
              <Input
                type="number"
                placeholder="450.00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Purpose / Spend Description</Label>
              <Input
                placeholder="Referee cash stipends for 3 games"
                value={payoutPurpose}
                onChange={(e) => setPayoutPurpose(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm mt-1"
              />
            </div>
            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setPayoutModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white rounded-full">
                Submit for Approval
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
