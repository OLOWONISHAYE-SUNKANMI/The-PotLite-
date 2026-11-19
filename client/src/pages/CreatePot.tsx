import React, { useState } from "react";
import { useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/config";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const CreatePot: React.FC = () => {
  const { currentUser, organizationName } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Pilot Pot Types
  const potTypes = [
    { id: "season fee", label: "Season Fee", icon: "⚽", desc: "Registration, field fees, league entry" },
    { id: "tournament", label: "Tournament", icon: "🏆", desc: "State Cup, showcase entry & ref fees" },
    { id: "uniforms and gear", label: "Uniforms & Gear", icon: "👕", desc: "Jerseys, practice kits, training gear" },
    { id: "travel", label: "Travel", icon: "🚌", desc: "Team bus, hotel blocks, away games" },
    { id: "fundraiser", label: "Fundraiser", icon: "🎯", desc: "Equipment drive, club donation match" },
    { id: "other", label: "Other", icon: "📋", desc: "Custom club expense or team event" },
  ];

  const [selectedType, setSelectedType] = useState<string>("tournament");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [perMemberAmount, setPerMemberAmount] = useState("");
  const [expectedMembers, setExpectedMembers] = useState("12");

  // Installments state
  const [installments, setInstallments] = useState<
    Array<{ num: number; amount: string; dueDate: string }>
  >([
    { num: 1, amount: "", dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0] },
  ]);

  const [loading, setLoading] = useState(false);

  const addInstallment = () => {
    if (installments.length >= 4) {
      toast({
        title: "Max Installments Reached",
        description: "V1 Pilot supports up to 4 installments per pot.",
      });
      return;
    }
    const nextNum = installments.length + 1;
    setInstallments([
      ...installments,
      { num: nextNum, amount: "50.00", dueDate: "2026-12-15" },
    ]);
  };

  const removeInstallment = (index: number) => {
    if (installments.length <= 1) {
      toast({
        title: "Minimum Required",
        description: "A pot must have at least one scheduled installment.",
      });
      return;
    }
    const updated = installments
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, num: idx + 1 }));
    setInstallments(updated);
  };

  const handleInstallmentChange = (
    index: number,
    field: "amount" | "dueDate",
    value: string
  ) => {
    const updated = [...installments];
    updated[index][field] = value;
    setInstallments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !goalAmount) {
      toast({
        title: "Missing Information",
        description: "Please provide a pot title and total goal amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const parsedGoal = parseFloat(goalAmount) || 0;
      const parsedPerMember = parseFloat(perMemberAmount) || (parsedGoal / (parseInt(expectedMembers) || 1));
      const finalDueDate = installments[installments.length - 1]?.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

      // Send to API
      const res = await fetch(apiUrl("/api/v1/pots"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: currentUser.organizationId || 1,
          name: name.trim(),
          pot_type: selectedType,
          potType: selectedType,
          description: description.trim(),
          total_target_amount: parsedGoal,
          goalAmount: parsedGoal,
          per_member_amount: parsedPerMember,
          perMemberAmount: parsedPerMember,
          due_date: finalDueDate,
          deadline: finalDueDate,
          createdById: currentUser.id,
          installments: installments.map((i) => ({
            installmentNumber: i.num,
            amount: parseFloat(i.amount) || parsedPerMember,
            dueDate: i.dueDate,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create pot on server");
      }

      toast({
        title: "Pot Initialized Successfully!",
        description: `"${name}" created with Human Rules v1 and ready for parent invitations.`,
      });

      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Pot Created",
        description: `"${name}" configured for ${organizationName || "your club"}.`,
      });
      setLocation("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>ThePotLite Pilot · Human Rules Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create a New Pilot Pot
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Set up an expense target, configure installment schedules, and invite team parents
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800/90 text-right shadow-sm hidden sm:block">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Organization
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {organizationName}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Type Selection */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-7 space-y-4 transition-colors">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Select Pilot Pot Type
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose the category that matches this team expense
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {potTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedType === type.id
                    ? "border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-white ring-2 ring-purple-600/30"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="text-xl mb-1 block">{type.icon}</span>
                <span className="font-bold text-xs sm:text-sm block">{type.label}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5 truncate">
                  {type.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Pot Details & Target */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-7 space-y-5 transition-colors">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Pot Identity & Target Amounts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify the title, scope, and total collective budget
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Pot Title
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. State Cup Tournament & Travel"
                className="h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Description & Scope
              </Label>
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What expenses does this pot cover? (e.g. Referee fees, field shelter, entry badges)"
                className="rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Total Goal Budget ($ USD)
              </Label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="number"
                  step="0.01"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="2400.00"
                  className="pl-10 h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Per-Player Target ($ USD)
              </Label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="number"
                  step="0.01"
                  value={perMemberAmount}
                  onChange={(e) => setPerMemberAmount(e.target.value)}
                  placeholder="200.00"
                  className="pl-10 h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Installment Schedule */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-7 space-y-4 transition-colors">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                3. Installment Milestones & Due Dates
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Break payment commitments into predictable parts for parents
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addInstallment}
              className="rounded-full text-xs font-semibold border-slate-300 dark:border-slate-700"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-purple-600 dark:text-purple-400" />
              Add Part
            </Button>
          </div>

          <div className="space-y-3">
            {installments.map((inst, idx) => (
              <div
                key={inst.num}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                    {inst.num}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    Installment #{inst.num}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-36">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="number"
                      step="0.01"
                      value={inst.amount}
                      onChange={(e) => handleInstallmentChange(idx, "amount", e.target.value)}
                      className="pl-8 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="relative flex-1 sm:w-44">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="date"
                      value={inst.dueDate}
                      onChange={(e) => handleInstallmentChange(idx, "dueDate", e.target.value)}
                      className="pl-8 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {installments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstallment(idx)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                      title="Remove Installment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governance Rules Summary */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-7 space-y-3 transition-colors">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Human-Controlled Governance Rules Active (v1)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Grace Period</span>
              <span className="font-extrabold text-slate-900 dark:text-white">2 Days</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Confirm Window</span>
              <span className="font-extrabold text-slate-900 dark:text-white">48 Hours</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">2-Approver Rule</span>
              <span className="font-extrabold text-slate-900 dark:text-white">&gt; $250.00</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Group Vote Rule</span>
              <span className="font-extrabold text-slate-900 dark:text-white">&gt; $1,000.00</span>
            </div>
          </div>
        </div>

        {/* Non-Custodial Assurance Card */}
        <div className="p-5 rounded-3xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/50 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
            <span className="font-bold block mb-0.5">Non-Custodial Governing Boundary</span>
            ThePotLite does not touch, hold, or transmit funds. Payments will take place directly between parents and team organizers off-platform (Cash, Zelle, Venmo, Check). The platform records obligations, tracks dual confirmations, and manages authorized payout spend sign-offs.
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/")}
            className="flex-1 rounded-full text-xs font-semibold py-3 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-full text-xs font-bold py-3.5 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30 flex items-center justify-center gap-2"
          >
            <span>{loading ? "Initializing Pot..." : "Initialize Pot & Generate Invites"}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePot;
