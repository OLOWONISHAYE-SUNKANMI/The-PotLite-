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
    <div className="w-full min-h-screen lg:h-screen flex flex-col lg:flex-row bg-white dark:bg-[#0c101c] font-sans transition-colors duration-300 overflow-x-hidden">
      {/* =========================================================================
          LEFT COLUMN: 100% FILLED BRAND PURPLE HERO WITH STEP PROGRESS
          ========================================================================= */}
      <div className="w-full lg:w-[48%] xl:w-[45%] 2xl:w-[42%] bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#312e81] text-white p-7 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden shrink-0 lg:h-full min-h-[440px] lg:min-h-0">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-400/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        {/* Top Header: Logo + Theme Switcher */}
        <div className="flex items-center justify-between z-10">
          <Link href="/" className="inline-flex items-center gap-3 cursor-pointer group">
            <img
              src="/thepot-logo.png"
              alt="The Pot Limited"
              className="w-12 h-12 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                <span>ThePot</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400/30 border border-amber-300/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                  Lite
                </span>
              </div>
              <p className="text-[11px] text-purple-200/80 font-medium">The Pot Limited · Youth Sports</p>
            </div>
          </Link>

          {/* Theme Toggle Pill */}
          <button
            onClick={() => toggleTheme()}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center gap-2 text-white text-xs font-medium transition-all backdrop-blur-md"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-purple-200" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Middle Headline & Tagline */}
        <div className="py-8 sm:py-12 lg:py-14 space-y-4 z-10 my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-bold shadow-sm">
            <span>{tagline}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
            {headline}
          </h1>
          <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed max-w-md">
            {subheading}
          </p>

          {/* Quick Pillars */}
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-purple-100/80">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
              ⚡ Non-Custodial
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
              🛡️ COPPA Safe
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
              📱 Twilio SMS 2FA
            </span>
          </div>
        </div>

        {/* Bottom 3 Step Cards (Exact match to reference image) */}
        <div className="z-10 pt-6 border-t border-white/15">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            {/* Step 1 */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between min-h-[105px] transition-all ${
                activeStep === 1
                  ? "bg-white text-slate-900 shadow-xl scale-102 ring-2 ring-white/80"
                  : "bg-white/10 backdrop-blur-md text-white/90 border border-white/15"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                  activeStep === 1
                    ? "bg-[#6366f1] text-white"
                    : activeStep > 1
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-white/20 text-white"
                }`}
              >
                {activeStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "1"}
              </div>
              <span className={`text-[12px] font-bold leading-tight ${activeStep === 1 ? "text-slate-900" : "text-white"}`}>
                Register your account
              </span>
            </div>

            {/* Step 2 */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between min-h-[105px] transition-all ${
                activeStep === 2
                  ? "bg-white text-slate-900 shadow-xl scale-102 ring-2 ring-white/80"
                  : "bg-white/10 backdrop-blur-md text-white/90 border border-white/15"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                  activeStep === 2
                    ? "bg-[#6366f1] text-white"
                    : activeStep > 2
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-white/20 text-white"
                }`}
              >
                {activeStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : "2"}
              </div>
              <span className={`text-[12px] font-bold leading-tight ${activeStep === 2 ? "text-slate-900" : "text-white"}`}>
                Set up profile & role
              </span>
            </div>

            {/* Step 3 */}
            <div
              className={`p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between min-h-[105px] transition-all ${
                activeStep === 3
                  ? "bg-white text-slate-900 shadow-xl scale-102 ring-2 ring-white/80"
                  : "bg-white/10 backdrop-blur-md text-white/90 border border-white/15"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                  activeStep === 3
                    ? "bg-[#6366f1] text-white"
                    : "bg-white/20 text-white"
                }`}
              >
                3
              </div>
              <span className={`text-[12px] font-bold leading-tight ${activeStep === 3 ? "text-slate-900" : "text-white"}`}>
                Verify via Twilio SMS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: 100% FILLED FORM AREA (SCROLLABLE & PERFECTLY CENTERED)
          ========================================================================= */}
      <div className="flex-1 w-full lg:h-full min-h-[500px] lg:min-h-0 overflow-y-auto flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-50/70 dark:bg-[#0c101c] transition-colors">
        <div className="w-full max-w-xl mx-auto py-6 sm:py-10">
          {children}
        </div>
      </div>
    </div>
  );
};

