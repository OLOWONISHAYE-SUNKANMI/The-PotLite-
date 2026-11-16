import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite } from "@/context/ThePotLiteContext";
import { useThePotLiteTheme } from "@/context/ThePotLiteThemeContext";
import {
  ShieldCheck,
  Search,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Mail,
  MessageSquare,
  Archive,
  Menu,
  X,
  User,
  LogIn,
  LogOut,
  Building2,
} from "lucide-react";

export const ThePotLiteAppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, switchRole, organizationName, isAuthenticated, logout } = useThePotLite();
  const { theme, toggleTheme } = useThePotLiteTheme();
  const [location, setLocation] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Avatar image URLs for Coach & Parent
  const avatarUrl =
    currentUser.role === "Organizer"
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80";

  const firstName = currentUser.name.split(" ")[0];

  const navItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      active: location === "/" || location === "/organizer" || location === "/member",
    },
    ...(currentUser.role === "Organizer"
      ? [
          {
            label: "Create Pot",
            path: "/create",
            icon: PlusCircle,
            active: location === "/create",
          },
        ]
      : []),
    {
      label: "Audit Timeline",
      path: "/audit",
      icon: FileText,
      active: location === "/audit",
    },
    {
      label: "Invite Demo",
      path: "/invite/101",
      icon: Mail,
      active: location.startsWith("/invite"),
    },
    {
      label: "Feedback",
      path: "/feedback",
      icon: MessageSquare,
      active: location === "/feedback",
    },
    {
      label: "Legacy Sandbox",
      path: "/legacy",
      icon: Archive,
      active: location === "/legacy",
    },
  ];

  return (
    <div className="w-full min-h-screen flex bg-[#f1f4f6] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* =========================================================================
          LEFT SIDEBAR (Fixed Height, Elegant Spacing, Independent Scrolling)
          ========================================================================= */}
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 lg:w-72 bg-white dark:bg-[#0f172a] border-r border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between p-5 transition-transform duration-300 shadow-sm shrink-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand & Organization Block */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
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

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Club / Org Badge */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                Organization
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {organizationName}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu (Scrolls cleanly if height is constrained) */}
        <div className="flex-1 py-4 overflow-y-auto space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
            Navigation
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  item.active
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Section: Perspective Switcher, Light/Dark Switch, User Card */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 shrink-0">
          {/* Light / Dark Mode Segmented Switch */}
          <div className="bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl flex items-center justify-between text-xs font-semibold">
            <button
              onClick={() => toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all ${
                theme === "light"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              onClick={() => toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all ${
                theme === "dark"
                  ? "bg-[#1e293b] text-purple-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              <span>Dark</span>
            </button>
          </div>

          {/* Perspective Switcher */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Perspective
            </span>
            <div className="bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl flex items-center justify-between text-xs font-semibold">
              <button
                onClick={() => switchRole("Organizer")}
                className={`flex-1 py-1.5 rounded-xl transition-all text-center ${
                  currentUser.role === "Organizer"
                    ? "bg-purple-700 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Organizer
              </button>
              <button
                onClick={() => switchRole("Member")}
                className={`flex-1 py-1.5 rounded-xl transition-all text-center ${
                  currentUser.role === "Member"
                    ? "bg-amber-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Parent
              </button>
            </div>
          </div>

          {/* User Profile Card with Sign Out / Gateway Link */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/20 shadow-sm shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.title}</p>
              </div>
            </div>

            {isAuthenticated ? (
              <button
                onClick={async () => {
                  await logout();
                  setLocation("/login");
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Log Out to Auth Gateway"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link href="/login">
                <button
                  className="p-1.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Sign In Gateway"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN AREA (100% Width Canvas)
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Matching Reference Image: Hello [Name] + Nav Pills + Search & Bell */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Greeting + Avatar (Exact match to "Hello, Siburian") */}
            <div className="flex items-center gap-2.5 shrink-0">
              <img
                src={avatarUrl}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shadow-sm"
              />
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white whitespace-nowrap">
                Hello, {firstName}
              </span>
            </div>

            {/* Top Navigation Pills (Exact match to [Overview] [Create Pot] [Audit] [Feedback]) */}
            <div className="hidden md:flex items-center gap-1.5 ml-2 text-xs font-semibold">
              <Link
                href="/"
                className={`px-4 py-1.5 rounded-full transition-all ${
                  location === "/" || location === "/organizer" || location === "/member"
                    ? "bg-purple-600 text-white font-bold shadow-sm shadow-purple-600/30"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Overview
              </Link>

              {currentUser.role === "Organizer" && (
                <Link
                  href="/create"
                  className={`px-4 py-1.5 rounded-full transition-all ${
                    location === "/create"
                      ? "bg-purple-600 text-white font-bold shadow-sm shadow-purple-600/30"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  Create Pot
                </Link>
              )}

              <Link
                href="/audit"
                className={`px-4 py-1.5 rounded-full transition-all ${
                  location === "/audit"
                    ? "bg-purple-600 text-white font-bold shadow-sm shadow-purple-600/30"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Audit
              </Link>

              <Link
                href="/feedback"
                className={`px-4 py-1.5 rounded-full transition-all ${
                  location === "/feedback"
                    ? "bg-purple-600 text-white font-bold shadow-sm shadow-purple-600/30"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                Feedback
              </Link>
            </div>
          </div>

          {/* Right Header Controls: Principle Badge, Search, Bell (24), Theme Toggle, Role Badge */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Top Principle Pill */}
            <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>No money handled · Consent-gated obligations</span>
            </div>

            {/* Search Button */}
            <button
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell with '24' badge (Exact match to reference image) */}
            <button
              className="relative w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight">
                24
              </span>
            </button>

            {/* Quick Dark Mode Toggle Button */}
            <button
              onClick={() => toggleTheme()}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-amber-400 hover:text-slate-900 transition-transform active:scale-95"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
            </button>

            {/* Role Indicator Badge */}
            <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              {currentUser.role}
            </span>
          </div>
        </header>

        {/* 100% Width Main Content Container */}
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};
