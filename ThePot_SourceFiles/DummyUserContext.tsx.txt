import { createContext, useContext, useState, ReactNode } from "react";

interface DummyUserContextType {
  currentUser: string;
  userRole: "admin" | "voter" | "recipient";
  setUserRole: (role: "admin" | "voter" | "recipient") => void;
}

const DummyUserContext = createContext<DummyUserContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [userRole, setUserRole] = useState<"admin" | "voter" | "recipient">("admin");
  
  return (
    <DummyUserContext.Provider
      value={{
        currentUser: "Current User",
        userRole,
        setUserRole
      }}
    >
      {children}
    </DummyUserContext.Provider>
  );
};

export const useDummyUser = () => {
  const context = useContext(DummyUserContext);
  if (context === undefined) {
    throw new Error("useDummyUser must be used within a ThemeProvider");
  }
  return context;
};
