import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  ShieldAlert,
  ArrowRight,
  Plus,
  HelpCircle,
  Receipt,
  Check,
  X,
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

export const ThePotLiteOrganizerDashboard: React.FC = () => {
  const { toast } = useToast();

  // Local state for interactive demo experience
  const [needsYouQueue, setNeedsYouQueue] = useState([
    {
      id: "pay_1",
      type: "confirmation",
      title: "Confirm Payment: Sarah Jenkins ($100.00)",
      detail: "Sarah marked 'Sent $100 via Zelle' on Nov 14 for Fall Tournament Pot",
      amount: "$100.00",
      method: "Zelle",
      status: "pending",
    },
    {
      id: "help_1",
      type: "assistance",
      title: "Extension Request: Dave Miller (More Time)",
      detail: "Requested 14-day extension for Uniforms installment. Reason: Waiting on bi-weekly paycheck.",
      visibility: "Organizers Only",
      status: "pending",
    },
    {
      id: "payout_1",
      type: "payout_approval",
      title: "Approve Payout: Referee Fees ($450.00)",
      detail: "Requested by Coach Marcus for State Cup ref cash stipend. Requires 2nd organizer approval.",
      amount: "$450.00",
      status: "pending",
    },
  ]);

  const [pots, setPots] = useState([
    {
      id: 1,
      name: "Fall 2026 Season Dues",
      potType: "season fee",
      team: "Tigers U12 Boys",
      goalAmount: 3600,
      confirmedTotal: 2700,
      pendingTotal: 300,
      deadline: "2026-11-30",
      obligations: { total: 12, confirmed: 9, pending: 1, overdue: 2 },
    },
    {
      id: 2,
      name: "State Cup Tournament & Travel",
      potType: "tournament",
      team: "Tigers U12 Boys",
      goalAmount: 2400,
      confirmedTotal: 1800,
      pendingTotal: 200,
      deadline: "2026-12-15",
      obligations: { total: 12, confirmed: 8, pending: 2, overdue: 2 },
    },
  ]);

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payee, setPayee] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutPurpose, setPayoutPurpose] = useState("");

  const handleConfirmPayment = (id: string) => {
    setNeedsYouQueue((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Payment Confirmed",
      description: "Payment confirmed. Applied to member obligation and Pot balance updated.",
    });
  };

  const handleApprovePayout = (id: string) => {
    setNeedsYouQueue((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Payout Approved",
      description: "Separation of duties satisfied. Marked approved for off-platform vendor payment.",
    });
  };

  const handleGrantExtension = (id: string) => {
    setNeedsYouQueue((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Extension Granted",
      description: "Proposed updated due date sent to member for explicit acceptance.",
    });
  };

  const handleCreatePayoutRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutModalOpen(false);
    toast({
      title: "Payout Spend Requested",
      description: `Request for $${payoutAmount} to ${payee} submitted. Routed to second organizer for sign-off.`,
    });
    setPayee("");
    setPayoutAmount("");
    setPayoutPurpose("");
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Organizer Dashboard</h1>
          <p className="text-sm text-slate-400">
            Youth sports governance · No money handled · All obligations consent-gated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPayoutModalOpen(true)}
            variant="outline"
            className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            <Receipt className="w-4 h-4 mr-2 text-amber-400" />
            Record Payout Spend
          </Button>
        </div>
      </div>

      {/* 1. "Needs You" Queue (Section 12) */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-800/40 border-b border-slate-800 py-3.5 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <CardTitle className="text-base font-semibold text-white">
                "Needs You" Action Queue ({needsYouQueue.length})
              </CardTitle>
            </div>
            <span className="text-xs text-slate-400">Actions requiring organizer sign-off</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-800">
          {needsYouQueue.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              🎉 All caught up! No confirmations, disputes, or payout approvals pending.
            </div>
          ) : (
            needsYouQueue.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{item.title}</span>
                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                      {item.type === "confirmation" ? "Offline Payment" : item.type === "assistance" ? "Hardship" : "Payout Sign-off"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">{item.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.type === "confirmation" && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirmPayment(item.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Confirm Received
                    </Button>
                  )}
                  {item.type === "payout_approval" && (
                    <Button
                      size="sm"
                      onClick={() => handleApprovePayout(item.id)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs h-8"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve Payout
                    </Button>
                  )}
                  {item.type === "assistance" && (
                    <Button
                      size="sm"
                      onClick={() => handleGrantExtension(item.id)}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8"
                    >
                      Accept 14d Extension
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 2. Active Pots Overview (Section 03, 05, 12) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Active Pots & Obligations</h2>
          <span className="text-xs text-slate-400">Progress bars reflect confirmed funds only</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pots.map((pot) => {
            const percent = Math.round((pot.confirmedTotal / pot.goalAmount) * 100);
            return (
              <Card key={pot.id} className="bg-slate-900 border-slate-800 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px] mb-1">
                        {pot.potType}
                      </Badge>
                      <CardTitle className="text-base font-semibold text-white">{pot.name}</CardTitle>
                      <p className="text-xs text-slate-400 mt-0.5">{pot.team}</p>
                    </div>
                    <Badge variant="outline" className="border-slate-700 text-xs text-slate-300">
                      Due {pot.deadline}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Confirmed Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-emerald-400 font-bold">
                        ${pot.confirmedTotal.toLocaleString()} Confirmed
                      </span>
                      <span className="text-slate-400">
                        ${pot.goalAmount.toLocaleString()} Goal ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} className="h-2.5 bg-slate-800" />
                    {pot.pendingTotal > 0 && (
                      <p className="text-[11px] text-amber-400/80 mt-1">
                        +${pot.pendingTotal} pending two-party confirmation
                      </p>
                    )}
                  </div>

                  {/* Obligations State Breakdown */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-800">
                    <div className="bg-slate-800/40 rounded p-1.5">
                      <span className="text-[10px] text-slate-400 block">Members</span>
                      <span className="text-xs font-bold text-white">{pot.obligations.total}</span>
                    </div>
                    <div className="bg-emerald-950/30 rounded p-1.5 border border-emerald-900/30">
                      <span className="text-[10px] text-emerald-400 block">Confirmed</span>
                      <span className="text-xs font-bold text-emerald-300">{pot.obligations.confirmed}</span>
                    </div>
                    <div className="bg-amber-950/30 rounded p-1.5 border border-amber-900/30">
                      <span className="text-[10px] text-amber-400 block">Pending</span>
                      <span className="text-xs font-bold text-amber-300">{pot.obligations.pending}</span>
                    </div>
                    <div className="bg-rose-950/30 rounded p-1.5 border border-rose-900/30">
                      <span className="text-[10px] text-rose-400 block">Overdue</span>
                      <span className="text-xs font-bold text-rose-300">{pot.obligations.overdue}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Record Payout Spend Dialog */}
      <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payout Spend Request</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              ThePotLite governs off-platform spending. The organization pays the vendor directly.
              Separation of duties applies: requester cannot self-approve.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePayoutRequest} className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-slate-300">Vendor / Payee</Label>
              <Input
                placeholder="e.g. State Cup Tournament Org / Referee Coordinator"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Amount ($)</Label>
              <Input
                type="number"
                placeholder="450.00"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Purpose / Spend Description</Label>
              <Input
                placeholder="Referee cash stipends for 3 games"
                value={payoutPurpose}
                onChange={(e) => setPayoutPurpose(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-sm mt-1"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPayoutModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white">
                Submit for Approval
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
