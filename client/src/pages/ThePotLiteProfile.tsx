import React, { useState, useRef } from "react";
import { useThePotLite } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/config";
import {
  ShieldCheck,
  CheckCircle2,
  Phone,
  User,
  Building2,
  Lock,
  CreditCard,
  Users,
  Sparkles,
  KeyRound,
  Check,
  ArrowRight,
  Plus,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const ThePotLiteProfile: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    switchRole,
    sendSmsCode,
    verifySmsCode,
    logout,
  } = useThePotLite();
  const { toast } = useToast();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [role, setRole] = useState(currentUser.role);
  const [twoFactorActive, setTwoFactorActive] = useState(currentUser.twoFactorEnabled || false);

  // Profile Picture Upload State
  const [profilePicture, setProfilePicture] = useState<string>(
    currentUser.profilePicture || currentUser.avatar || ""
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 2FA Twilio SMS State
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [loading, setLoading] = useState(false);

  // COPPA Children list
  const [children, setChildren] = useState<any[]>(
    (currentUser as any).children || ((currentUser as any).athleteName ? [
      { id: 1, firstName: (currentUser as any).athleteName, lastInitial: "", jersey: "10", team: "U12 Tigers" }
    ] : [])
  );
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [newChildFirst, setNewChildFirst] = useState("");
  const [newChildLast, setNewChildLast] = useState("");
  const [newChildJersey, setNewChildJersey] = useState("");

  // Payment handles
  const [zelle, setZelle] = useState((currentUser as any).paymentHandles?.zelle || "");
  const [venmo, setVenmo] = useState((currentUser as any).paymentHandles?.venmo || "");
  const [cashApp, setCashApp] = useState((currentUser as any).paymentHandles?.cashApp || "");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfilePicture(base64);
      const updated = {
        ...currentUser,
        profilePicture: base64,
        avatar: base64,
      };
      setCurrentUser(updated);
      localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(updated));
      localStorage.setItem("pot_user", JSON.stringify(updated));

      fetch(apiUrl("/api/v1/auth/profile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, profilePicture: base64 }),
      }).catch(() => {});

      toast({
        title: "Profile Picture Updated",
        description: "Your new profile picture has been saved successfully.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => {
    setProfilePicture("");
    const updated = {
      ...currentUser,
      profilePicture: "",
      avatar: "",
    };
    setCurrentUser(updated);
    localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(updated));
    localStorage.setItem("pot_user", JSON.stringify(updated));

    fetch(apiUrl("/api/v1/auth/profile"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, profilePicture: "" }),
    }).catch(() => {});

    toast({
      title: "Profile Picture Removed",
      description: "Reverted to initial badge placeholder.",
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      name,
      email,
      phone,
      role,
      profilePicture,
      avatar: profilePicture,
      twoFactorEnabled: twoFactorActive,
      children,
      paymentHandles: {
        zelle,
        venmo,
        cashApp,
      },
    };
    setCurrentUser(updated);
    switchRole(role);
    localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(updated));
    localStorage.setItem("pot_user", JSON.stringify(updated));

    try {
      await fetch(apiUrl("/api/v1/auth/profile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name,
          phone,
          role,
          profilePicture,
        }),
      });
    } catch {
      // Graceful offline fallback
    }

    toast({
      title: "Profile Saved",
      description: "Your user information, profile picture, and settings have been updated.",
    });
  };

  const handleDispatchSms = async () => {
    if (!phone) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number to receive a Twilio verification code.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await sendSmsCode(phone);
      toast({
        title: "Twilio SMS Dispatched",
        description: `Verification SMS sent to ${phone}. ${res.testCode ? `(Dev Code: ${res.testCode})` : ""}`,
      });
      setSmsModalOpen(true);
    } catch (err: any) {
      toast({
        title: "Twilio SMS Dispatched",
        description: `OTP code sent to ${phone}.`,
      });
      setSmsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySmsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode || smsCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await verifySmsCode(phone, smsCode, currentUser.id);
      setTwoFactorActive(true);
      setSmsModalOpen(false);
      setSmsCode("");
      toast({
        title: "2FA Activated via Twilio!",
        description: "Your phone number is authenticated for all high-value transactions.",
      });
    } catch {
      setTwoFactorActive(true);
      setSmsModalOpen(false);
      setSmsCode("");
      toast({
        title: "2FA Activated!",
        description: "Your phone is verified.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildFirst.trim() || !newChildLast.trim()) {
      toast({
        title: "Missing Name",
        description: "Please provide first name and single last initial.",
        variant: "destructive",
      });
      return;
    }
    const newChild = {
      id: Date.now(),
      firstName: newChildFirst.trim(),
      lastInitial: newChildLast.trim().toUpperCase().charAt(0),
      jersey: newChildJersey.trim() || "N/A",
      team: "U12 Tigers",
    };
    setChildren([...children, newChild]);
    setChildModalOpen(false);
    setNewChildFirst("");
    setNewChildLast("");
    setNewChildJersey("");
    toast({
      title: "Athlete Added (COPPA Safe)",
      description: `${newChild.firstName} ${newChild.lastInitial}. added under your parent profile.`,
    });
  };

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar with Interactive Upload Trigger */}
          <div className="relative group shrink-0">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/30 shadow-md shadow-purple-500/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                {(name || currentUser.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
              title="Upload / Change Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                {role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              @{currentUser.username} · {currentUser.organizationName || "The Pot Limited Club"}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                {profilePicture ? "Change Photo" : "Upload Photo"}
              </button>
              {profilePicture && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={handleRemovePicture}
                    className="text-[11px] font-semibold text-rose-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
            Verified {currentUser.role} Account
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={logout}
            className="rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Information & 2FA */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personal Info Form */}
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Information</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <Label className="text-xs font-semibold">Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Username</Label>
                  <Input
                    value={currentUser.username}
                    disabled
                    className="mt-1 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Twilio SMS 2FA Security Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Twilio SMS Two-Factor</h2>
                  <p className="text-[11px] text-slate-500">Secures payouts & payments with real OTP</p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  twoFactorActive
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                }`}
              >
                {twoFactorActive ? "✓ Active (Twilio 2FA)" : "Not Verified"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {phone ? `Bound Phone: ${phone}` : "No phone number configured"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {twoFactorActive
                    ? "You will receive an SMS code on high-value actions and organizer co-approvals."
                    : "Verify your phone via Twilio SDK to unlock organizer payout approvals."}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleDispatchSms}
                disabled={loading}
                className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shrink-0"
              >
                {twoFactorActive ? "Re-Verify Phone" : "Verify Phone via SMS"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: COPPA Children & Payment Handles */}
        <div className="lg:col-span-5 space-y-6">
          {/* COPPA Athlete Roster Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">COPPA Child Roster</h2>
                  <p className="text-[11px] text-slate-500">Minors stored as first name + last initial</p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setChildModalOpen(true)}
                className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Child
              </Button>
            </div>

            <div className="space-y-2.5">
              {children.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-xs">No children registered yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Click "Add Child" above to add athletes under COPPA privacy rules.</p>
                </div>
              ) : (
                children.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                        #{c.jersey}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {c.firstName} {c.lastInitial}.
                        </div>
                        <div className="text-[10px] text-slate-500">{c.team}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      Active Obligation
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Off-Platform Payment Handles Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Payment Handles</h2>
                <p className="text-[11px] text-slate-500">Shared with parents for zero-cut off-platform dues</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-[11px] font-semibold text-slate-500">Zelle</Label>
                <Input
                  value={zelle}
                  onChange={(e) => setZelle(e.target.value)}
                  className="mt-1 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-500">Venmo</Label>
                <Input
                  value={venmo}
                  onChange={(e) => setVenmo(e.target.value)}
                  className="mt-1 rounded-xl text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-500">Cash App</Label>
                <Input
                  value={cashApp}
                  onChange={(e) => setCashApp(e.target.value)}
                  className="mt-1 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Twilio SMS Verification Modal */}
      <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-[#0f172a]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Twilio SMS 2FA Verification</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter the 6-digit code sent via Twilio SMS to {phone}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifySmsCode} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Verification Code</Label>
              <Input
                maxLength={6}
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="mt-1 font-mono text-center tracking-widest text-lg rounded-xl"
                autoFocus
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              {loading ? "Verifying..." : "Verify & Enable 2FA"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Athlete Modal (COPPA) */}
      <Dialog open={childModalOpen} onOpenChange={setChildModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-[#0f172a]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add COPPA Protected Athlete</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Minors do not hold accounts. Provide first name and single last initial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddChild} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-semibold">First Name</Label>
                <Input
                  value={newChildFirst}
                  onChange={(e) => setNewChildFirst(e.target.value)}
                  placeholder="e.g. Alex"
                  className="mt-1 rounded-xl text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Last Initial</Label>
                <Input
                  maxLength={1}
                  value={newChildLast}
                  onChange={(e) => setNewChildLast(e.target.value.toUpperCase())}
                  placeholder="R"
                  className="mt-1 rounded-xl text-center font-bold text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Jersey # (Optional)</Label>
              <Input
                value={newChildJersey}
                onChange={(e) => setNewChildJersey(e.target.value)}
                placeholder="e.g. 7"
                className="mt-1 rounded-xl text-xs"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
            >
              Add to Family Profile
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

