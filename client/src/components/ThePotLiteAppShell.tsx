import React from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite, UserRole } from "@/context/ThePotLiteContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  User,
  Activity,
  PlusCircle,
  FileText,
  Home,
  CheckCircle2,
  Users,
} from "lucide-react";

export const ThePotLiteAppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, switchRole, organizationName } = useThePotLite();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner: Governing Principle */}
      <div className="bg-purple-950/80 border-b border-purple-800/40 text-purple-200 text-xs py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
        <span>
          <strong>ThePotLite V1:</strong> No money handled · No disputes adjudicated · No obligations silently changed
        </span>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand & Organization Context */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-900/40">
                P
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-purple-300 transition-colors">
                  ThePot<span className="text-amber-400">Lite</span>
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-400 ml-2 border-l border-slate-700 pl-2">
                  {organizationName}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                location === "/" ? "bg-purple-900/50 text-purple-300 font-semibold" : "text-slate-300 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            {currentUser.role === "Organizer" && (
              <Link
                href="/create"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  location === "/create" ? "bg-purple-900/50 text-purple-300 font-semibold" : "text-slate-300 hover:text-white"
                }`}
              >
                Create Pot
              </Link>
            )}
            <Link
              href="/audit"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                location === "/audit" ? "bg-purple-900/50 text-purple-300 font-semibold" : "text-slate-300 hover:text-white"
              }`}
            >
              Audit Timeline
            </Link>
          </nav>

          {/* Role Switching & User Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800/80 rounded-full p-1 border border-slate-700">
              <button
                onClick={() => switchRole("Organizer")}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-all ${
                  currentUser.role === "Organizer"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Organizer
              </button>
              <button
                onClick={() => switchRole("Member")}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-all ${
                  currentUser.role === "Member"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Parent / Member
              </button>
            </div>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400">{currentUser.title}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex justify-around py-2 px-4 shadow-xl">
        <Link href="/" className="flex flex-col items-center gap-1 text-slate-300 hover:text-purple-400">
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>
        {currentUser.role === "Organizer" && (
          <Link href="/create" className="flex flex-col items-center gap-1 text-slate-300 hover:text-purple-400">
            <PlusCircle className="w-5 h-5" />
            <span className="text-[10px]">Create</span>
          </Link>
        )}
        <Link href="/audit" className="flex flex-col items-center gap-1 text-slate-300 hover:text-purple-400">
          <FileText className="w-5 h-5" />
          <span className="text-[10px]">Timeline</span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500 mb-12 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>ThePotLite V1 Pilot · Youth Sports Governance</span>
          <span>Payments occur off-platform (Cash, Cash App, Zelle, Venmo, Check)</span>
        </div>
      </footer>
    </div>
  );
};
