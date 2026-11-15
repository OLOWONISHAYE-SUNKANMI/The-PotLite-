import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "Organizer" | "Member";

export interface DemoUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  organizationId: number;
  organizationName: string;
}

export const DEMO_USERS: Record<string, DemoUser> = {
  organizer: {
    id: 10,
    name: "Coach Marcus (Organizer)",
    email: "coach.marcus@tigersfc.org",
    role: "Organizer",
    title: "Head Coach & Director",
    organizationId: 1,
    organizationName: "Tigers Youth Soccer Club",
  },
  member: {
    id: 42,
    name: "Sarah Jenkins (Parent)",
    email: "sarah.jenkins@example.com",
    role: "Member",
    title: "Parent of Jordan M. (U12)",
    organizationId: 1,
    organizationName: "Tigers Youth Soccer Club",
  },
};

interface ThePotLiteContextType {
  currentUser: DemoUser;
  setCurrentUser: (user: DemoUser) => void;
  switchRole: (role: UserRole) => void;
  organizationName: string;
}

const ThePotLiteContext = createContext<ThePotLiteContextType | undefined>(undefined);

export const ThePotLiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<DemoUser>(() => {
    const saved = localStorage.getItem("thepotlite_active_role");
    return saved === "Member" ? DEMO_USERS.member : DEMO_USERS.organizer;
  });

  const switchRole = (role: UserRole) => {
    const target = role === "Organizer" ? DEMO_USERS.organizer : DEMO_USERS.member;
    setCurrentUser(target);
    localStorage.setItem("thepotlite_active_role", role);
  };

  return (
    <ThePotLiteContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
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
