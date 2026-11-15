import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
import {
  ShieldCheck,
  Search,
  Bell,
  User,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export const ThePotLiteAppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, switchRole, organizationName } = useThePotLite();
  const [location] = useLocation();
  const [activeNav, setActiveNav] = useState<"Overview" | "Pots" | "Obligations" | "Audit" | "Cheffy">("Overview");

  // Avatar image URLs for Coach & Parent
  const avatarUrl =
    currentUser.role === "Organizer"
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80";

  return (
    <div className="min-h-screen bg-[#e8ebed] text-slate-800 p-2 sm:p-5 md:p-8 flex flex-col justify-center items-center font-sans">
      {/* Top Banner Notice */}
      <div className="w-full max-w-6xl mb-3 flex items-center justify-between text-xs text-slate-600 px-3">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>
            <strong>ThePotLite V1:</strong> No money handled · No disputes adjudicated · No obligations silently changed
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-500">
          <span>Organization: <strong className="text-slate-800">{organizationName}</strong></span>
        </div>
      </div>

      {/* Main Dashboard Window Frame (Exact layout & rounded corners from reference image) */}
      <div className="w-full max-w-6xl bg-[#f8fafc] border border-slate-200/90 rounded-[32px] sm:rounded-[36px] p-4 sm:p-6 md:p-8 shadow-2xl shadow-slate-300/60 transition-all">
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          {/* User Profile on Left */}
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt={currentUser.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500/20 shadow-sm"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                Hello, {currentUser.name.split(" ")[0]}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {currentUser.title}
              </p>
            </div>
          </div>

          {/* Center Navigation Pills */}
          <nav className="flex items-center bg-slate-200/70 p-1 rounded-full shadow-inner">
            <Link
              href="/"
              onClick={() => setActiveNav("Overview")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                activeNav === "Overview" && location === "/"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Overview
            </Link>
            <Link
              href={currentUser.role === "Organizer" ? "/create" : "/"}
              onClick={() => setActiveNav("Pots")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                activeNav === "Pots"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {currentUser.role === "Organizer" ? "New Pot" : "My Pots"}
            </Link>
            <Link
              href="/audit"
              onClick={() => setActiveNav("Audit")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                activeNav === "Audit" || location === "/audit"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Audit Log
            </Link>
            <Link
              href="/invite/101"
              onClick={() => setActiveNav("Cheffy")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                activeNav === "Cheffy" || location.startsWith("/invite")
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Invite Demo
            </Link>
          </nav>

          {/* Right Action Icons & Role Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Search Circle Button */}
            <button
              title="Search"
              className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Badge Circle Button */}
            <button
              title="Notifications"
              className="relative w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                3
              </span>
            </button>

            {/* Role Switcher Pill (Organizer vs Member) */}
            <div className="flex items-center bg-slate-200/80 rounded-full p-0.5 border border-slate-300/80 ml-1">
              <button
                onClick={() => switchRole("Organizer")}
                className={`px-3 py-1 text-xs rounded-full font-semibold transition-all ${
                  currentUser.role === "Organizer"
                    ? "bg-purple-700 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Organizer
              </button>
              <button
                onClick={() => switchRole("Member")}
                className={`px-3 py-1 text-xs rounded-full font-semibold transition-all ${
                  currentUser.role === "Member"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Parent
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Canvas */}
        <main className="pt-6">
          {children}
        </main>
      </div>

      {/* Footer Info */}
      <footer className="w-full max-w-6xl mt-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between px-3">
        <span>ThePotLite V1 Pilot · Youth Sports Governance</span>
        <span>Payments occur off-platform · Two-party confirmed</span>
      </footer>
    </div>
  );
};
