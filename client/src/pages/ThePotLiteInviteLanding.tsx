import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Info,
  DollarSign,
  UserCheck,
} from "lucide-react";

export const ThePotLiteInviteLanding: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);

  // Invite details snapshot
  const invite = {
    id: id || "inv_101",
    potName: "State Cup Tournament & Travel",
    potType: "tournament",
    organization: "Tigers Youth Soccer Club",
    team: "Tigers U12 Boys",
    coach: "Coach Marcus Lewis",
    purpose: "Referee fees, official tournament entry registration, and team bench shelter.",
    totalAmount: "$200.00",
    termsVersion: 1,
    deadline: "November 30, 2026",
    expiryHoursLeft: 68,
    schedule: [
      { num: 1, amount: "$100.00", dueDate: "October 15, 2026" },
      { num: 2, amount: "$100.00", dueDate: "November 18, 2026" },
    ],
    rules: [
      "No money handled by platform: payments occur off-platform directly to the team/coach.",
      "Dual confirmation required: both payer and organizer confirm each payment.",
      "Consent-gated: amounts and dates never change without your recorded acceptance.",
      "Assistance available: request extensions or financial help privately at any time.",
    ],
  };

  const handleAccept = () => {
    setAccepted(true);
    toast({
      title: "Terms Accepted!",
      description: `You have explicitly accepted the terms (Version ${invite.termsVersion}). Obligation created.`,
    });
  };

  const handleDecline = () => {
    setDeclined(true);
    toast({
      title: "Invitation Declined",
      description: "You have declined this invite. No obligation was created.",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 space-y-6">
      {/* Brand header */}
      <div className="text-center space-y-3">
        <img
          src="/thepot-logo.png"
          alt="The Pot Limited"
          className="w-16 h-16 object-contain mx-auto drop-shadow-sm"
        />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>The Pot Limited · Terms Version {invite.termsVersion}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {invite.potName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {invite.organization} · {invite.team} · Organized by {invite.coach}
        </p>
      </div>

      {accepted ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-emerald-500/30 p-8 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">You're In! Obligation Created</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
              Your explicit consent to Terms Version {invite.termsVersion} has been recorded in the immutable audit log. No money has moved; your schedule is live on your Parent Dashboard.
            </p>
          </div>
          <Link href="/">
            <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-full text-xs shadow-sm shadow-purple-600/30">
              Open Parent Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      ) : declined ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">Invitation Declined</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            An invite not accepted is not an obligation. No records or charges were created, and the organizers have been notified.
          </p>
          <Link href="/">
            <Button variant="outline" className="rounded-full text-xs border-slate-300 dark:border-slate-700">
              Return Home
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm overflow-hidden transition-colors">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-950/30 dark:to-amber-950/20 px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Total Commitment Requested
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {invite.totalAmount}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>Expires in {invite.expiryHoursLeft}h</span>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* Purpose */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Purpose & Scope
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {invite.purpose}
              </p>
            </div>

            {/* Installments Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Proposed Installment Schedule
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden">
                {invite.schedule.map((inst) => (
                  <div
                    key={inst.num}
                    className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex justify-between items-center text-xs"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Installment #{inst.num}
                    </span>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {inst.amount}
                      </span>
                      <span className="text-[11px] text-slate-400">Due {inst.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Governance Guarantees */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                ThePotLite Governance Guarantees
              </h3>
              <div className="space-y-2">
                {invite.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 rounded-full text-xs font-semibold py-2.5 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Decline Invite
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 rounded-full text-xs font-bold py-2.5 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30"
            >
              Accept Terms (Version {invite.termsVersion})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
