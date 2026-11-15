import React from "react";
import { Link } from "wouter";
import { useThePotLiteTheme } from "@/context/ThePotLiteThemeContext";
import { ShieldCheck, Sun, Moon, ArrowRight, LayoutDashboard } from "lucide-react";

export const ThePotLiteAuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme } = useThePotLiteTheme();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#f8fafc] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Top Header */}
      <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-purple-900/20">
            P
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
              ThePot<span className="text-amber-500">Lite</span>
            </span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded ml-1.5 uppercase tracking-wider">
              V1 Pilot
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Quick Enter Dashboard Link */}
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard Demo</span>
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={() => toggleTheme()}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-amber-400 hover:text-slate-900 transition-transform active:scale-95 shadow-sm"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
          </button>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">{children}</div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full py-4 px-6 border-t border-slate-200/70 dark:border-slate-800/70 text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Non-Custodial Boundary: No payment processing or money handling.</span>
        </div>
        <span>COPPA Compliant · Youth Sports Governance</span>
      </footer>
    </div>
  );
};
