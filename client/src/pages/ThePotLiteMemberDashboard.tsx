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
  Sparkles,
  Send,
  HelpCircle,
  Receipt,
  Check,
  Calendar,
  Eye,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const ThePotLiteMemberDashboard: React.FC = () => {
  const { toast } = useToast();

  // Cheffy Prompt state
  const [activePrompt, setActivePrompt] = useState<{
    id: number;
    text: string;
    potName: string;
    amount: string;
    dueDate: string;
  } | null>({
    id: 1,
    text: "Your $100.00 for Fall Tournament is due in 3 days. Where do you stand?",
    potName: "State Cup Tournament & Travel",
    amount: "$100.00",
    dueDate: "Nov 18, 2026",
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [assistanceModalOpen, setAssistanceModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("100.00");
  const [paymentMethod, setPaymentMethod] = useState("Zelle");
  const [paymentNote, setPaymentNote] = useState("");
  const [assistanceType, setAssistanceType] = useState<"more_time" | "financial_help">("more_time");
  const [assistanceVisibility, setAssistanceVisibility] = useState<"organizers_only" | "organizers_and_group">("organizers_only");

  // Member's obligations
  const [obligations, setObligations] = useState([
    {
      id: 101,
      potName: "State Cup Tournament & Travel",
      potType: "tournament",
      playerName: "Jordan M. (U12 Boys)",
      totalAmount: 200,
      confirmedAmount: 100,
      pendingAmount: 0,
      state: "Partially paid",
      nextDueDate: "2026-11-18",
      installments: [
        { num: 1, amount: 100, state: "Confirmed", dueDate: "2026-10-15" },
        { num: 2, amount: 100, state: "Accepted", dueDate: "2026-11-18" },
      ],
    },
    {
      id: 102,
      potName: "Fall 2026 Season Dues",
      potType: "season fee",
      playerName: "Jordan M. (U12 Boys)",
      totalAmount: 300,
      confirmedAmount: 300,
      pendingAmount: 0,
      state: "Confirmed",
      nextDueDate: "Completed",
      installments: [
        { num: 1, amount: 150, state: "Confirmed", dueDate: "2026-09-01" },
        { num: 2, amount: 150, state: "Confirmed", dueDate: "2026-10-01" },
      ],
    },
  ]);

  // One-tap Cheffy prompt responses
  const handlePromptGreen = () => {
    setActivePrompt(null);
    toast({
      title: "On Track Recorded",
      description: "Thanks! Cheffy logged your intent as On Track. Reminders will stay on schedule.",
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
      description: "Cheffy notified the organizers. You can optionally provide feedback or withdraw.",
    });
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentModalOpen(false);
    toast({
      title: "Payment Recorded",
      description: `Marked as sent $${paymentAmount} via ${paymentMethod}. Pending organizer confirmation.`,
    });
  };

  const handleSubmitAssistance = (e: React.FormEvent) => {
    e.preventDefault();
    setAssistanceModalOpen(false);
    toast({
      title: "Assistance Request Submitted",
      description: `Your request was routed with privacy setting: ${assistanceVisibility.replace("_", " ")}.`,
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Parent / Member Portal</h1>
        <p className="text-sm text-slate-400">
          Player: <strong className="text-amber-400">Jordan M.</strong> · Tigers Youth Soccer Club
        </p>
      </div>

      {/* 1. "Needs Your Response" Cheffy Prompt Banner (Section 06 & 12) */}
      {activePrompt && (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 p-5 shadow-lg shadow-amber-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Cheffy Prompt · Action Needed
                </span>
                <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                  {activePrompt.potName}
                </Badge>
              </div>
              <p className="text-sm font-medium text-white">{activePrompt.text}</p>
              
              {/* One-tap Response Options */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handlePromptGreen}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 mr-1.5 inline-block"></span>
                  Green: On Track
                </Button>
                <Button
                  size="sm"
                  onClick={handlePromptYellow}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-300 mr-1.5 inline-block"></span>
                  Yellow: Need Time / Help
                </Button>
                <Button
                  size="sm"
                  onClick={handlePromptRed}
                  variant="outline"
                  className="border-rose-700/60 text-rose-300 hover:bg-rose-950 text-xs h-8"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 mr-1.5 inline-block"></span>
                  Red: Want to Leave
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. My Active Pots & Obligations (Section 03, 04, 12) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">My Obligations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {obligations.map((ob) => {
            const percent = Math.round((ob.confirmedAmount / ob.totalAmount) * 100);
            return (
              <Card key={ob.id} className="bg-slate-900 border-slate-800 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px] mb-1">
                        {ob.potType}
                      </Badge>
                      <CardTitle className="text-base font-semibold text-white">{ob.potName}</CardTitle>
                      <p className="text-xs text-slate-400 mt-0.5">{ob.playerName}</p>
                    </div>
                    <Badge
                      className={
                        ob.state === "Confirmed"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : "bg-amber-950 text-amber-300 border-amber-800"
                      }
                    >
                      {ob.state}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-emerald-400 font-bold">
                        ${ob.confirmedAmount.toFixed(2)} Confirmed
                      </span>
                      <span className="text-slate-400">
                        Total: ${ob.totalAmount.toFixed(2)} ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} className="h-2 bg-slate-800" />
                  </div>

                  {/* Installments Breakdown */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-semibold text-slate-300">Schedule Parts:</span>
                    {ob.installments.map((inst) => (
                      <div
                        key={inst.num}
                        className="flex justify-between items-center text-xs p-2 rounded bg-slate-800/40 border border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-200">
                            Part #{inst.num}: ${inst.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Due {inst.dueDate}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              inst.state === "Confirmed"
                                ? "text-emerald-400 border-emerald-800/40"
                                : "text-amber-400 border-amber-800/40"
                            }`}
                          >
                            {inst.state}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  {ob.state !== "Confirmed" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => setPaymentModalOpen(true)}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-xs h-9"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        Mark Payment Sent
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setAssistanceModalOpen(true)}
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9"
                      >
                        <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                        Assistance
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 3. Payout Transparency Card (Section 10 & 12) */}
      <Card className="bg-slate-900 border-slate-800 shadow-md">
        <CardHeader className="py-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-400" />
              <CardTitle className="text-sm font-semibold text-white">
                Team Payout Transparency (Where Collected Money Goes)
              </CardTitle>
            </div>
            <span className="text-xs text-slate-400">Off-platform disbursements with receipts</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 divide-y divide-slate-800 text-xs">
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-200">State Cup Tournament Entry Fee</p>
              <p className="text-slate-400 text-[11px]">Payee: State Youth Soccer Assoc · Paid via Check #1042</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-white">$1,200.00</span>
              <p className="text-[10px] text-emerald-400">Approved by 2 Organizers</p>
            </div>
          </div>
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <p className="font-semibold text-slate-200">Team Uniforms & Numbers</p>
              <p className="text-slate-400 text-[11px]">Payee: SoccerGear Depot · Paid via Organization Card</p>
            </div>
            <div className="text-right">
              <span className="font-bold text-white">$850.00</span>
              <p className="text-[10px] text-emerald-400">Receipt Attached</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark Payment Sent Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Payment Sent</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              ThePotLite does not process funds. Send your payment directly using Cash App, Zelle, Venmo, Cash, or Check, then record it here. The organizer will confirm receipt.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment} className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-slate-300">Amount Sent ($)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Payment Method</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-md p-2 mt-1"
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
              <Label className="text-xs text-slate-300">Optional Reference / Note</Label>
              <Input
                placeholder="Confirmation # or note"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="bg-slate-800 border-slate-700 text-sm mt-1"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white">
                Submit Statement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assistance (Yellow Path) Modal */}
      <Dialog open={assistanceModalOpen} onOpenChange={setAssistanceModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Assistance (Yellow Path)</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              No shaming. You control who learns about your situation. All requests are confidential by default.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAssistance} className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-slate-300">What do you need?</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="needType"
                    checked={assistanceType === "more_time"}
                    onChange={() => setAssistanceType("more_time")}
                  />
                  More Time (Extension)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="needType"
                    checked={assistanceType === "financial_help"}
                    onChange={() => setAssistanceType("financial_help")}
                  />
                  Financial Help (Scholarship/Sponsor)
                </label>
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-300">Who may see this request?</Label>
              <div className="space-y-1.5 mt-2">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={assistanceVisibility === "organizers_only"}
                    onChange={() => setAssistanceVisibility("organizers_only")}
                  />
                  Organizers Only (Recommended · Fully Confidential)
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    checked={assistanceVisibility === "organizers_and_group"}
                    onChange={() => setAssistanceVisibility("organizers_and_group")}
                  />
                  Organizers + Team Group (Allows community booster support)
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAssistanceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white">
                Send Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
