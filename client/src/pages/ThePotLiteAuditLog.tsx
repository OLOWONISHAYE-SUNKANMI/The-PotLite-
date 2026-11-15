import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
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
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Immutable Append-Only Audit Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Organization Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Every action produces an immutable, timestamped event log entry with actor, role, object, and terms version. Records are corrected solely by subsequent entries — never silently edited or deleted.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-5 text-xs font-semibold shadow-sm shadow-purple-600/20"
        >
          <Download className="w-4 h-4 mr-2 text-amber-400" />
          Export Audit CSV
        </Button>
      </div>

      {/* Timeline Stream Card */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Tigers Youth Soccer Club · Plain-Language Event Stream
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
            {events.length} Events Logged
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-5 sm:p-6 flex items-start gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      evt.actorRole === "Organizer"
                        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    {evt.actorRole}: {evt.actorName}
                  </Badge>

                  <span className="text-xs font-medium text-slate-400">{evt.timestamp}</span>

                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Terms v{evt.termsVersion} · Rules v{evt.ruleVersion}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {evt.plainTextTimelineEntry}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
