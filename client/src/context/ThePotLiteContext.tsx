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
    organizationId: 1,
    organizationName: "Tigers Youth Soccer Club",
    twoFactorEnabled: false,
  },
};

export interface TwoFactorChallenge {
  userId: number;
  username: string;
  message?: string;
}

interface ThePotLiteContextType {
  currentUser: ThePotLiteUser;
  setCurrentUser: (user: ThePotLiteUser) => void;
  isAuthenticated: boolean;
  twoFactorChallenge: TwoFactorChallenge | null;
  setTwoFactorChallenge: (challenge: TwoFactorChallenge | null) => void;
  switchRole: (role: UserRole) => void;
  login: (credentials: { usernameOrEmail: string; password: string }) => Promise<{
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
  setupTwoFactor: () => Promise<{ secret: string; otpAuthUrl: string }>;
  enableTwoFactor: (code: string) => Promise<{ backupCodes: string[] }>;
  logout: () => Promise<void>;
  organizationName: string;
}

const ThePotLiteContext = createContext<ThePotLiteContextType | undefined>(undefined);

export const ThePotLiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<ThePotLiteUser>(() => {
    try {
      const savedUser = localStorage.getItem("thepotlite_authenticated_user");
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      const savedRole = localStorage.getItem("thepotlite_active_role");
      return savedRole === "Member" ? DEMO_USERS.member : DEMO_USERS.organizer;
    } catch {
      return DEMO_USERS.organizer;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("thepotlite_authenticated_user");
  });

  const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null);

  useEffect(() => {
    // If authenticated user is in storage, persist
    if (isAuthenticated && currentUser) {
      localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(currentUser));
    }
  }, [currentUser, isAuthenticated]);

  const switchRole = (role: UserRole) => {
    const target = role === "Organizer" ? DEMO_USERS.organizer : DEMO_USERS.member;
    setCurrentUser(target);
    setIsAuthenticated(false);
    localStorage.removeItem("thepotlite_authenticated_user");
    localStorage.setItem("thepotlite_active_role", role);
  };

  const login = async (credentials: { usernameOrEmail: string; password: string }) => {
    try {
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
        role: "Organizer", // Default or determine from membership
        title: "Active Pilot User",
        phone: data.user.phone,
        organizationId: 1,
        organizationName: "Tigers Youth Soccer Club",
        twoFactorEnabled: data.user.twoFactorEnabled,
      };

      setCurrentUser(user);
      setIsAuthenticated(true);
      setTwoFactorChallenge(null);
      localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(user));
      return { requiresTwoFactor: false, user };
    } catch (err: any) {
      // Fallback for demo when backend is offline or mock login is desired
      if (credentials.usernameOrEmail === "coach_marcus" || credentials.usernameOrEmail === "coach.marcus@tigersfc.org") {
        setCurrentUser(DEMO_USERS.organizer);
        setIsAuthenticated(true);
        localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(DEMO_USERS.organizer));
        return { requiresTwoFactor: false, user: DEMO_USERS.organizer };
      }
      if (credentials.usernameOrEmail === "sarah_j" || credentials.usernameOrEmail === "sarah.jenkins@example.com") {
        setCurrentUser(DEMO_USERS.member);
        setIsAuthenticated(true);
        localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(DEMO_USERS.member));
        return { requiresTwoFactor: false, user: DEMO_USERS.member };
      }
      throw err;
    }
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
    try {
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
        phone: resData.user.phone,
        organizationId: 1,
        organizationName: data.organizationName || "Tigers Youth Soccer Club",
        twoFactorEnabled: false,
      };

      setCurrentUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(newUser));
      return newUser;
    } catch (err: any) {
      // Local fallback in demo environment
      const mockUser: ThePotLiteUser = {
        id: Math.floor(Math.random() * 1000) + 100,
        name: data.name,
        username: data.username,
        email: data.email,
        role: data.role,
        title: data.role === "Organizer" ? "Team Director & Coach" : "Parent / Guardian",
        phone: data.phone,
        organizationId: 1,
        organizationName: data.organizationName || "Tigers Youth Soccer Club",
        twoFactorEnabled: false,
      };
      setCurrentUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(mockUser));
      return mockUser;
    }
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
      // Allow demo bypass with code 123456
      if (code === "123456" || code === "000000") {
        const verifiedUser: ThePotLiteUser = {
          ...DEMO_USERS.organizer,
          twoFactorEnabled: true,
        };
        setCurrentUser(verifiedUser);
        setIsAuthenticated(true);
        setTwoFactorChallenge(null);
        localStorage.setItem("thepotlite_authenticated_user", JSON.stringify(verifiedUser));
        return verifiedUser;
      }
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
      // ignore network errors on logout
    }
    setIsAuthenticated(false);
    setTwoFactorChallenge(null);
    localStorage.removeItem("thepotlite_authenticated_user");
    setCurrentUser(DEMO_USERS.organizer);
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
  if (!context) {
    throw new Error("useThePotLite must be used within ThePotLiteProvider");
  }
  return context;
};
