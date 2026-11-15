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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Official ThePotLite Invitation
          </div>
          <h1 className="text-2xl font-extrabold text-white">{invite.potName}</h1>
          <p className="text-sm text-slate-400">
            {invite.organization} · {invite.team}
          </p>
        </div>

        {accepted ? (
          <Card className="bg-slate-900 border-emerald-800/60 p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">You're In!</h2>
              <p className="text-xs text-slate-300 mt-1">
                Your acceptance of Terms Version {invite.termsVersion} was recorded at {new Date().toLocaleTimeString()}.
              </p>
            </div>
            <Link href="/">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                Go to Member Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        ) : declined ? (
          <Card className="bg-slate-900 border-slate-800 p-6 text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-300">Invitation Declined</h2>
            <p className="text-xs text-slate-400">
              An invite not accepted is not an obligation. No records or charges were created.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full border-slate-700">
                Return Home
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-800/40 border-b border-slate-800 pb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Commitment:</span>
                <span className="text-lg font-bold text-amber-400">{invite.totalAmount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Invite expires in {invite.expiryHoursLeft} hours</span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5 text-xs">
              {/* Purpose */}
              <div>
                <span className="font-semibold text-slate-300 block mb-1">Collection Purpose:</span>
                <p className="text-slate-400">{invite.purpose}</p>
              </div>

              {/* Installment Schedule */}
              <div>
                <span className="font-semibold text-slate-300 block mb-2">Installment Schedule:</span>
                <div className="space-y-1.5">
                  {invite.schedule.map((s) => (
                    <div
                      key={s.num}
                      className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-800"
                    >
                      <span className="text-slate-200">
                        Part #{s.num}: <strong>{s.amount}</strong>
                      </span>
                      <span className="text-slate-400">Due {s.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Organization Rules & Governance */}
              <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 space-y-2">
                <span className="font-semibold text-slate-300 block">Organization Rules in Force:</span>
                <ul className="space-y-1 text-slate-400">
                  {invite.rules.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-800/30 border-t border-slate-800 p-4 flex gap-3">
              <Button
                variant="outline"
                onClick={handleDecline}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
              >
                Accept Terms & Commit
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};
