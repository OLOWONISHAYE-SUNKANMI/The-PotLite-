import React, { useState } from "react";
import { Link } from "wouter";
import {
  Archive,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Database,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PotDashboard from "./PotDashboard";

export const ThePotLiteLegacyArchive: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"migration_matrix" | "sandbox">("migration_matrix");

  const migrationItems = [
    {
      domain: "Payment Rails & Wallets",
      legacy: "Integrated Stripe, Moov, Unit, and custodial wallet balances.",
      v1pilot: "Strictly Non-Custodial: No money handled on platform. Off-rail recording with dual confirmations.",
      status: "Migrated / Deprecated",
      color: "emerald",
    },
    {
      domain: "Core Domain Entity",
      legacy: "Pot-centric (money pooled in central wallet balance).",
      v1pilot: "Obligation-centric: Individual versioned commitments with explicit consent gating.",
      status: "Upgraded",
      color: "purple",
    },
    {
      domain: "Governance & Payouts",
      legacy: "Ad-hoc voting on simulated balance release.",
      v1pilot: "Anti-Self-Approval: Separation of duties, 2-approver threshold ($250), and group votes ($1,000).",
      status: "Upgraded",
      color: "purple",
    },
    {
      domain: "Youth Athlete Data",
      legacy: "Stored player emails and direct member accounts.",
      v1pilot: "COPPA Safe: Minors hold zero accounts; rostered under adult with first name + last initial only.",
      status: "Enforced",
      color: "emerald",
    },
    {
      domain: "Dispute Handling",
      legacy: "Simulated administrative freeze or auto-refund.",
      v1pilot: "Neutral Record-Keeping: Disputed statements logged side-by-side with timestamps without taking sides.",
      status: "Upgraded",
      color: "amber",
    },
  ];

  return (
    <div className="w-full space-y-6 py-4">
      {/* Top Banner Notice */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-slate-900 to-amber-950/40 border border-purple-500/30 text-white space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Legacy Replit Reference Sandbox & Migration Archive
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          Reference Prototype vs ThePotLite V1 Pilot
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          This archive provides architectural audit reference between the initial Replit prototype and the upgraded V1 Pilot specification. In accordance with the project directives, all custodial payment processing (Stripe, Plaid, Moov, Unit) is deprecated from active user journeys.
        </p>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setActiveTab("migration_matrix")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "migration_matrix"
                ? "bg-[#a3e635] text-slate-950 shadow-sm"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            📊 Migration Architecture Matrix
          </button>
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "sandbox"
                ? "bg-[#a3e635] text-slate-950 shadow-sm"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            🧪 Legacy Replit Sandbox (Interactive)
          </button>
        </div>
      </div>

      {activeTab === "migration_matrix" ? (
        /* Architecture Matrix */
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Specification Upgrade Comparison
              </span>
            </div>
            <Link href="/audit">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">
                View Live Audit Log →
              </span>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {migrationItems.map((item, idx) => (
              <div key={idx} className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {item.domain}
                  </span>
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.color === "emerald"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        : item.color === "amber"
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                        : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="md:col-span-4 p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30">
                  <span className="text-[10px] uppercase font-bold text-rose-500 block mb-1">
                    Legacy Replit Prototype
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.legacy}
                  </p>
                </div>

                <div className="md:col-span-5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                    ThePotLite V1 Pilot (Current)
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {item.v1pilot}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
            <span>Reference Document: THEPOTLITE_V1_REPLIT_MIGRATION_MAP.md</span>
            <Link href="/">
              <Button className="rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-5">
                Return to V1 Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Legacy Sandbox View */
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-4 sm:p-6 transition-colors overflow-x-auto">
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>⚠️ Running legacy component tree. Do not use for production collections.</span>
            <button
              onClick={() => setActiveTab("migration_matrix")}
              className="text-xs font-bold underline ml-2"
            >
              Back to Matrix
            </button>
          </div>
          <div className="text-slate-800 dark:text-slate-200">
            <PotDashboard />
          </div>
        </div>
      )}
    </div>
  );
};

export default ThePotLiteLegacyArchive;
