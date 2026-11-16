import React from "react";
import { Link } from "wouter";
import { useThePotLiteTheme } from "@/context/ThePotLiteThemeContext";
import { Sun, Moon, ShieldCheck, Check } from "lucide-react";

interface ThePotLiteAuthLayoutProps {
  children: React.ReactNode;
  activeStep?: 1 | 2 | 3;
  tagline?: string;
  headline?: string;
  subheading?: string;
}

export const ThePotLiteAuthLayout: React.FC<ThePotLiteAuthLayoutProps> = ({
  children,
  activeStep = 1,
  tagline = "Join Us to Build 🤩",
  headline = "Start your Journey",
  subheading = "Follow these simple steps to set up your account.",
}) => {
  const { theme, toggleTheme } = useThePotLiteTheme();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#111319] dark:bg-[#07090e] p-3 sm:p-6 transition-colors duration-300 font-sans">
      {/* Outer Floating Card matching Reference Image */}
      <div className="w-full max-w-5xl rounded-[28px] sm:rounded-[36px] overflow-hidden bg-white dark:bg-[#131927] border border-slate-200/40 dark:border-slate-800/80 shadow-2xl flex flex-col lg:flex-row">
        {/* =========================================================================
            LEFT COLUMN: BRAND PURPLE GRADIENT HERO WITH STEP CARDS
            ========================================================================= */}
        <div className="lg:w-[48%] bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#312e81] text-white p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden shrink-0">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="flex items-center justify-between z-10">
            <Link href="/" className="inline-flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-white text-sm shadow-inner">
                P
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                ThePot<span className="text-amber-300">Lite</span>
              </span>
            </Link>

            {/* Quick Theme Toggle for Convenience */}
            <button
              onClick={() => toggleTheme()}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-purple-200" />}
            </button>
          </div>

          {/* Middle Headline */}
          <div className="py-10 sm:py-14 space-y-3 z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
              <span>{tagline}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {headline}
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed max-w-sm">
              {subheading}
            </p>
          </div>

          {/* Bottom 3 Step Cards (Exact match to reference image) */}
          <div className="grid grid-cols-3 gap-2.5 z-10 pt-4 border-t border-white/15">
            {/* Step 1 */}
            <div
              className={`p-3 rounded-2xl flex flex-col justify-between min-h-[96px] transition-all ${
                activeStep === 1
                  ? "bg-white text-slate-900 shadow-lg scale-102"
                  : "bg-white/10 backdrop-blur-md text-white/90 border border-white/15"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  activeStep === 1
                    ? "bg-[#6366f1] text-white"
                    : activeStep > 1
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-white/20 text-white"
                }`}
              >
                {activeStep > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : "1"}
              </div>
              <span className={`text-[11px] font-bold leading-tight ${activeStep === 1 ? "text-slate-900" : "text-white"}`}>
                Register your account
              </span>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3 rounded-2xl flex flex-col justify-between min-h-[96px] transition-all ${
                activeStep === 2
                  ? "bg-white text-slate-900 shadow-lg scale-102"
                  : "bg-white/10 backdrop-blur-md text-white/90 border border-white/15"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  activeStep === 2
                    ? "bg-[#6366f1] text-white"
                    : activeStep > 2
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-white/20 text-white"
                }`}
              >
                {activeStep > 2 ? <Check className="w-3 h-3 stroke-[3]" /> : "2"}
              </div>
              <span className={`text-[11px] font-bold leading-tight ${activeStep === 2 ? "text-slate-900" : "text-white"}`}>
                Set up profile & role
              </span>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3 rounded-2xl flex flex-col justify-between min-h-[96px] transition-all ${
                activeStep === 3
                  ? "bg-white text-slate-900 shadow-lg scale-102"
                  : "bg-white/10 backdrop-blur-md text-white/90 border border-white/15"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  activeStep === 3
                    ? "bg-[#6366f1] text-white"
                    : "bg-white/20 text-white"
                }`}
              >
                3
              </div>
              <span className={`text-[11px] font-bold leading-tight ${activeStep === 3 ? "text-slate-900" : "text-white"}`}>
                Verify via Twilio SMS
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: WHITE / DARK FORM AREA
            ========================================================================= */}
        <div className="flex-1 p-7 sm:p-10 lg:p-12 flex flex-col justify-center bg-white dark:bg-[#131927] transition-colors">
          {children}
        </div>
      </div>
    </div>
  );
};
