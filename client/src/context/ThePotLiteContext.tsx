import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "Organizer" | "Member";

export interface ThePotLiteUser {
  id: number;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  title: string;
  phone?: string;
  organizationId: number;
  organizationName: string;
  twoFactorEnabled?: boolean;
}

export const DEMO_USERS: Record<string, ThePotLiteUser> = {
  organizer: {
    id: 10,
    name: "Coach Marcus Lewis",
    email: "coach.marcus@tigersfc.org",
    username: "coach_marcus",
    role: "Organizer",
    title: "Head Coach & Director",
    phone: "+1 (555) 019-2834",
    organizationId: 1,
    organizationName: "Tigers Youth Soccer Club",
    twoFactorEnabled: true,
  },
  member: {
    id: 42,
    name: "Sarah Jenkins",
    email: "sarah.jenkins@example.com",
    username: "sarah_j",
    role: "Member",
    title: "Parent of Jordan M. (U12)",
    phone: "+1 (555) 014-9821",
    organizationId: 1,
    organizationName: "Tigers Youth Soccer Club",
    twoFactorEnabled: false,
  },
};

export interface TwoFactorChallenge {
  userId: number;
  username: string;
  phone?: string;
  method?: "totp" | "sms";
  message?: string;
}

interface ThePotLiteContextType {
  currentUser: ThePotLiteUser;
  setCurrentUser: (user: ThePotLiteUser) => void;
  isAuthenticated: boolean;
  twoFactorChallenge: TwoFactorChallenge | null;
  setTwoFactorChallenge: (challenge: TwoFactorChallenge | null) => void;
  switchRole: (role: UserRole) => void;
  login: (credentials: { usernameOrEmail: string; password: string; phone?: string }) => Promise<{
    requiresTwoFactor?: boolean;
    challenge?: TwoFactorChallenge;
    user?: ThePotLiteUser;
  }>;
  register: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
    organizationName?: string;
  }) => Promise<ThePotLiteUser>;
  verifyTwoFactor: (code: string) => Promise<ThePotLiteUser>;
  sendSmsCode: (phone: string) => Promise<{ success: boolean; message: string; testCode?: string }>;
  verifySmsCode: (phone: string, code: string, userId?: number) => Promise<{ success: boolean; user?: any }>;
  setupTwoFactor: () => Promise<{ secret: string; otpAuthUrl: string }>;
  enableTwoFactor: (code: string) => Promise<{ backupCodes: string[] }>;
  logout: () => Promise<void>;
  organizationName: string;
}

const EMPTY_USER: ThePotLiteUser = {
  id: 0,
  name: "",
  email: "",
  username: "",
  role: "Organizer",
  title: "Guest",
  organizationId: 1,
  organizationName: "",
  twoFactorEnabled: false,
};

const defaultContextValue: ThePotLiteContextType = {
  currentUser: EMPTY_USER,
  setCurrentUser: () => {},
  isAuthenticated: false,
  twoFactorChallenge: null,
  setTwoFactorChallenge: () => {},
  switchRole: () => {},
  login: async () => ({}),
  register: async () => EMPTY_USER,
  verifyTwoFactor: async () => EMPTY_USER,
  sendSmsCode: async () => ({ success: false, message: "" }),
  verifySmsCode: async () => ({ success: false }),
  setupTwoFactor: async () => ({ secret: "", otpAuthUrl: "" }),
  enableTwoFactor: async () => ({ backupCodes: [] }),
  logout: async () => {},
  organizationName: "",
};

const ThePotLiteContext = createContext<ThePotLiteContextType>(defaultContextValue);

export const ThePotLiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ThePotLiteUser>(() => {
    try {
      const savedUser = localStorage.getItem("thepotlite_authenticated_user");
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      return EMPTY_USER;
    } catch {
      return EMPTY_USER;
    }
  });

  // User must log in or register before accessing dashboard; strictly checks saved authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("thepotlite_authenticated_user");
  });

  const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null);

  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.id > 0) {
      localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(currentUser));
    }
  }, [currentUser, isAuthenticated]);

  const switchRole = (role: UserRole) => {
    if (currentUser.id > 0) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(updated));
    }
  };

  const login = async (credentials: { usernameOrEmail: string; password: string; phone?: string }) => {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    if (data.requiresTwoFactor) {
      const challenge: TwoFactorChallenge = {
        userId: data.userId,
        username: data.username,
        phone: credentials.phone,
        method: "sms",
        message: data.message,
      };
      setTwoFactorChallenge(challenge);
      return { requiresTwoFactor: true, challenge };
    }

    const user: ThePotLiteUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      username: data.user.username,
      role: (data.user.role as UserRole) || "Organizer",
      title: data.user.role === "Member" ? "Parent / Guardian" : "Team Organizer",
      phone: data.user.phone || credentials.phone,
      organizationId: data.user.organizationId || 1,
      organizationName: data.user.organizationName || "The Pot Limited Club",
      twoFactorEnabled: !!data.user.twoFactorEnabled,
    };

    setCurrentUser(user);
    setIsAuthenticated(true);
    setTwoFactorChallenge(null);
    localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(user));
    return { requiresTwoFactor: false, user };
  };

  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
    organizationName?: string;
  }) => {
    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        username: data.username,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: data.role,
        title: data.role === "Organizer" ? "Team Director & Coach" : "Parent / Guardian",
        organizationId: 1,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || "Registration failed");
    }

    const newUser: ThePotLiteUser = {
      id: resData.user.id,
      name: resData.user.name,
      email: resData.user.email,
      username: resData.user.username,
      role: data.role,
      title: data.role === "Organizer" ? "Team Director & Coach" : "Parent / Guardian",
      phone: resData.user.phone || data.phone,
      organizationId: 1,
      organizationName: data.organizationName || "The Pot Limited Club",
      twoFactorEnabled: false,
    };

    setCurrentUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(newUser));
    return newUser;
  };

  const sendSmsCode = async (phone: string) => {
    const res = await fetch("/api/v1/auth/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send SMS code");
    return data;
  };

  const verifySmsCode = async (phone: string, code: string, userId?: number) => {
    const res = await fetch("/api/v1/auth/sms/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to verify SMS code");

    const verifiedUser: ThePotLiteUser = {
      id: userId || currentUser.id || 10,
      name: currentUser.name || "Pilot User",
      email: currentUser.email || "user@thepotlite.org",
      username: currentUser.username || "user",
      role: currentUser.role || "Organizer",
      title: currentUser.title || "Verified Pilot User (SMS 2FA Active)",
      phone,
      organizationId: currentUser.organizationId || 1,
      organizationName: currentUser.organizationName || "The Pot Limited Club",
      twoFactorEnabled: true,
    };

    setCurrentUser(verifiedUser);
    setIsAuthenticated(true);
    setTwoFactorChallenge(null);
    localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(verifiedUser));
    return data;
  };

  const verifyTwoFactor = async (code: string) => {
    if (!twoFactorChallenge) {
      throw new Error("No pending two-factor challenge");
    }

    try {
      const res = await fetch("/api/v1/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: twoFactorChallenge.userId,
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Two-factor verification failed");
      }

      const user: ThePotLiteUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        username: data.user.username,
        role: "Organizer",
        title: "Verified Organizer (2FA Active)",
        organizationId: 1,
        organizationName: "Tigers Youth Soccer Club",
        twoFactorEnabled: true,
      };

      setCurrentUser(user);
      setIsAuthenticated(true);
      setTwoFactorChallenge(null);
      localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(user));
      return user;
    } catch (err: any) {
      throw err;
    }
  };

  const setupTwoFactor = async () => {
    const res = await fetch("/api/v1/auth/2fa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to setup 2FA");
    return data;
  };

  const enableTwoFactor = async (code: string) => {
    const res = await fetch("/api/v1/auth/2fa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to enable 2FA");
    setCurrentUser((prev) => ({ ...prev, twoFactorEnabled: true }));
    return data;
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors
    }
    setIsAuthenticated(false);
    setCurrentUser(EMPTY_USER);
    setTwoFactorChallenge(null);
    localStorage.removeItem("thepotlite_authenticated_user");
  };

  return (
    <ThePotLiteContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        twoFactorChallenge,
        setTwoFactorChallenge,
        switchRole,
        login,
        register,
        verifyTwoFactor,
        sendSmsCode,
        verifySmsCode,
        setupTwoFactor,
        enableTwoFactor,
        logout,
        organizationName: currentUser.organizationName,
      }}
    >
      {children}
    </ThePotLiteContext.Provider>
  );
};

export const useThePotLite = () => {
  const context = useContext(ThePotLiteContext);
  return context || defaultContextValue;
};
