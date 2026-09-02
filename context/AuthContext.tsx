"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getCurrentUser, logout as apiLogout } from "../lib/api";
import type { User } from "../types/auth";

type AuthContextValue = {
  user: User | null;
  checkingSession: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (mounted) setUser(currentUser);
      })
      .catch((error) => {
        console.error("Session restoration failed:", error);
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setCheckingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, checkingSession, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}