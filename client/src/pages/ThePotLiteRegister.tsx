import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useThePotLite, UserRole } from "@/context/ThePotLiteContext";
import { useToast } from "@/hooks/use-toast";
import { ThePotLiteAuthShell } from "@/components/ThePotLiteAuthShell";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ThePotLiteRegister: React.FC = () => {
  const { register } = useThePotLite();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("Organizer");
  const [organizationName, setOrganizationName] = useState("Tigers Youth Soccer Club");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !password) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill out your name, username, email, and password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name,
        username,
        email,
        password,
        phone,
        role,
        organizationName,
      });

      toast({
        title: "Registration Complete!",
        description: `Welcome, ${user.name}! Your account is active under ${organizationName}. Entering dashboard...`,
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Could not register account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThePotLiteAuthShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>ThePotLite V1 Pilot · Registration Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create Your Pilot Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Consent-gated tracking, transparent governance, and zero money handled
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-8 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection Pills */}
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                Select Your Role in Organization
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("Organizer")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    role === "Organizer"
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-white ring-2 ring-purple-600/30"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <div className="font-extrabold text-xs sm:text-sm flex items-center justify-between">
                    <span>Organizer / Coach</span>
                    {role === "Organizer" && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Create pots, verify offline payments, and initiate authorized payout disbursements.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("Member")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    role === "Member"
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-white ring-2 ring-amber-500/30"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <div className="font-extrabold text-xs sm:text-sm flex items-center justify-between">
                    <span>Parent / Member</span>
                    {role === "Member" && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Accept versioned commitments for youth players, record off-platform payments, and request aid.
                  </p>
                </button>
              </div>
            </div>

            {/* User Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Full Legal Name
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Coach Marcus Lewis"
                    className="pl-10 h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Username
                </Label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="coach_marcus"
                  className="h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coach@example.com"
                    className="pl-10 h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mobile Phone (Optional)
                </Label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 019-2834"
                    className="pl-10 h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password (Min 8 Characters)
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-10 h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Club / Organization Name
                </Label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Tigers Youth Soccer Club"
                    className="pl-10 h-11 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full text-xs font-bold py-3.5 bg-[#a3e635] hover:bg-[#8ece28] text-slate-950 shadow-md shadow-[#a3e635]/20 flex items-center justify-center gap-2"
              >
                <span>{loading ? "Creating Account..." : "Complete Registration & Enter Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Card Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an adult account?{" "}
            <Link href="/login" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>

        {/* COPPA Safe Notice */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">COPPA Youth Protection:</strong> Minors under 13 do not register. Youth athletes are added as roster dependents (storing only first name and last initial) under verified adult accounts.
          </p>
        </div>
      </div>
    </ThePotLiteAuthShell>
  );
};
