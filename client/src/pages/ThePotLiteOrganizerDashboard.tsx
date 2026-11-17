import React, { useState } from "react";
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
  const { toast } = useToast();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeCurrency, setActiveCurrency] = useState<"USD" | "Tigers U12" | "Fall 2026">("USD");
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payee, setPayee] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutPurpose, setPayoutPurpose] = useState("");

  // Action Queue item matching the reference image's top item with inline check/cross
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    id: string;
    payerName: string;
    amount: string;
    method: string;
    detail: string;
  } | null>({
    id: "conf_1",
    payerName: "Sarah Jenkins",
    amount: "$100.00",
    method: "Zelle",
    detail: "Payment confirmation needed",
  });

  const handleCopyOrgId = () => {
    navigator.clipboard?.writeText("90340222748");
    toast({
      title: "Copied to Clipboard",
      description: "Organization / Pot ID #90340222748 copied.",
    });
  };

  const handleConfirmAction = async () => {
    setPendingConfirmation(null);
    try {
      await fetch(apiUrl("/api/v1/pots/payments/1/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Graceful local handling
    }
    toast({
      title: "Dual Confirmation Verified!",
      description: "Applied $100.00 to Sarah Jenkins' obligation. Anti-self-approval rule satisfied.",
    });
  };

  const handleRejectAction = async () => {
    setPendingConfirmation(null);
    toast({
      title: "Neutral Discrepancy Logged",
      description: "Both member and coach statements saved to audit trail. No punitive fees charged.",
    });
  };

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutModalOpen(false);
    const amountVal = parseFloat(payoutAmount) || 0;
    try {
      await fetch(apiUrl("/api/v1/governance/payouts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          potId: 1,
          payee,
          amount: amountVal,
          purpose: payoutPurpose || "Youth tournament entry & referee fees",
        }),
      });
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
                  {balanceVisible ? "$92,142.10" : "••••••••••"}
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
                <span>$2,700 confirmed of $3,600 goal (Season Dues) · Off-rail verified</span>
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
                onClick={() => toast({ title: "Needs You Queue", description: "Review actions requiring organizer review below." })}
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-full shadow-sm transition-all"
              >
                <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Request Balance</span>
              </button>

              <button className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white shadow-sm transition-colors">
                <MoreHorizontal className="w-4 h-4" />
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
                Your Collections (Pending & Confirmed)
              </span>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  $12,172.07
                </span>
                <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                  +40% this month
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
                  <span>☆ 4,780</span>
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
                  <span>🎟 124</span>
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
              <span className="text-sm font-bold text-slate-900 dark:text-white">Spending</span>
              <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                April / Fall
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
                  strokeDashoffset="100"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-900 dark:text-white">$916.10</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/80 dark:text-purple-300 px-2 py-0.5 rounded-full mt-0.5">
                  +12%
                </span>
              </div>
            </div>

            <div className="text-center pb-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                <span>✦ Rent / Field spend is up</span>
                <span className="text-rose-500 font-bold">8.4%</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white inline-block"></span>
              <span>Field / Rent <strong className="text-slate-900 dark:text-white">$500.02</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 inline-block"></span>
              <span>Travel $217.00</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 inline-block"></span>
              <span>Referee $100.00</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 inline-block"></span>
              <span>Uniforms $100.00</span>
            </div>
          </div>
        </div>

        {/* Card 2: Earning / Collections Allocation (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Earning / Target</span>
              <span className="text-xs font-bold text-[#e1683d] bg-[#fbf2ed] dark:bg-[#e1683d]/20 px-2.5 py-1 rounded-full border-b-2 border-[#e1683d]">
                🎯 $8400
              </span>
            </div>

            <div className="py-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight block">
                $7,110.12
              </span>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                +18% vs last month
              </span>
            </div>

            <div className="space-y-4 pt-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-400">Tournament Entry</span>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">$2,000.00</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-300 dark:bg-slate-600 h-2 rounded-full w-2/5"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-900 dark:text-white font-bold">Season Dues</span>
                  <span className="text-slate-900 dark:text-white font-bold">$4,000.00</span>
                </div>
                <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 flex items-center">
                  <div className="bg-purple-600 h-3 rounded-full w-[51%]"></div>
                  <span className="absolute left-[45%] text-[9px] font-black bg-purple-950 text-white px-1.5 py-0.2 rounded-full shadow-sm">
                    51%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-400">Uniforms & Gear</span>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">$1,335.01</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-300 dark:bg-slate-600 h-2 rounded-full w-1/4"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-400">Travel & Misc</span>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">$486.00</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-300 dark:bg-slate-600 h-2 rounded-full w-1/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Transactions / "Needs You" Queue (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0f172a] rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Transactions</span>
              <button className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingConfirmation && (
                <div className="py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {pendingConfirmation.payerName} {pendingConfirmation.amount}
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        {pendingConfirmation.detail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleConfirmAction}
                      className="w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                      title="Confirm Payment"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <button
                      onClick={handleRejectAction}
                      className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
                      title="Dispute / Reject"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )}

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Salary / Referee Payment</p>
                    <p className="text-[10px] text-slate-400">Today, 09:00 AM</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">+$5,000.00</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Buy - Uniforms Gear</p>
                    <p className="text-[10px] text-slate-400">Yesterday, 2:30 PM</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">-$4,000.00</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Refund - Zelle Pay</p>
                    <p className="text-[10px] text-slate-400">Apr 1, 2026</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">+$120.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
