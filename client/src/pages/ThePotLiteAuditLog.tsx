import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Filter,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";

export const ThePotLiteAuditLog: React.FC = () => {
  const { toast } = useToast();

  const [events] = useState([
    {
      id: 1,
      timestamp: "Nov 15, 2026 · 14:32",
      actorRole: "Member",
      actorName: "Sarah Jenkins",
      action: "payment_recorded_offline",
      objectType: "Payment",
      termsVersion: 1,
      ruleVersion: 1,
      plainTextTimelineEntry: "Sarah recorded $100.00 via Zelle for State Cup Tournament & Travel (Part #1). Pending organizer confirmation.",
    },
    {
      id: 2,
      timestamp: "Nov 14, 2026 · 18:10",
      actorRole: "Organizer",
      actorName: "Coach Marcus Lewis",
      action: "payout_requested",
      objectType: "Payout",
      termsVersion: 1,
      ruleVersion: 1,
      plainTextTimelineEntry: "Coach Marcus requested $450.00 payout spend to Referee Coordinator for State Cup Referees. Subject to separation of duties.",
    },
    {
      id: 3,
      timestamp: "Nov 12, 2026 · 09:15",
      actorRole: "Member",
      actorName: "Dave Miller",
      action: "assistance_requested",
      objectType: "Obligation",
      termsVersion: 1,
      ruleVersion: 1,
      plainTextTimelineEntry: "Dave Miller requested 14-day extension for Uniforms installment. Visibility: Organizers Only (Confidential).",
    },
    {
      id: 4,
      timestamp: "Nov 10, 2026 · 11:45",
      actorRole: "Member",
      actorName: "Sarah Jenkins",
      action: "obligation_accepted",
      objectType: "Obligation",
      termsVersion: 1,
      ruleVersion: 1,
      plainTextTimelineEntry: "Sarah Jenkins explicitly accepted commitment of $200.00 (Terms Version 1) for Jordan M. (U12 Boys).",
    },
    {
      id: 5,
      timestamp: "Nov 08, 2026 · 10:00",
      actorRole: "Organizer",
      actorName: "Coach Marcus Lewis",
      action: "pot_created",
      objectType: "Pot",
      termsVersion: 1,
      ruleVersion: 1,
      plainTextTimelineEntry: "Pot 'State Cup Tournament & Travel' ($2,400.00 goal) initialized with Human Governance Rules v1.",
    },
  ]);

  const handleExportCSV = () => {
    // Generate simple CSV payload
    const headers = "Timestamp,Actor Role,Object,Terms Version,Timeline Entry\n";
    const rows = events
      .map(
        (e) =>
          `"${e.timestamp}","${e.actorRole}","${e.objectType}",${e.termsVersion},"${e.plainTextTimelineEntry.replace(/"/g, '""')}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `thepotlite_audit_log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Audit Log Exported",
      description: "CSV report generated and downloaded for organization records.",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            Append-Only Audit Log
          </h1>
          <p className="text-sm text-slate-400">
            Immutable, timestamped event ledger · Records are corrected by new events, never edited or deleted
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs"
        >
          <Download className="w-4 h-4 mr-2 text-amber-400" />
          Export Audit CSV
        </Button>
      </div>

      {/* Timeline Stream */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="py-4 border-b border-slate-800 bg-slate-800/30">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Plain-Language Event Stream (Tigers Youth Soccer Club)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-800">
          {events.map((evt) => (
            <div key={evt.id} className="p-4 sm:p-5 flex items-start gap-3 hover:bg-slate-800/20 transition-colors">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-purple-400 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      evt.actorRole === "Organizer"
                        ? "text-purple-300 border-purple-800"
                        : "text-amber-300 border-amber-800"
                    }`}
                  >
                    {evt.actorRole}: {evt.actorName}
                  </Badge>
                  <span className="text-[11px] text-slate-500">{evt.timestamp}</span>
                  <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-800">
                    Terms v{evt.termsVersion} · Rule v{evt.ruleVersion}
                  </Badge>
                </div>
                <p className="text-sm text-slate-200 font-medium">{evt.plainTextTimelineEntry}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

