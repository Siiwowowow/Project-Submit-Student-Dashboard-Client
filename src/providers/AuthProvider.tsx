"use client";

import { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "@/services/auth.services";
import type { ICurrentUser } from "@/types/user.types";

interface AuthContextType {
  user: ICurrentUser | null;
  setUser: (user: ICurrentUser | null) => void;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser }: {
  children: React.ReactNode; initialUser: ICurrentUser | null;
}) {
  const [user, setUser] = useState(initialUser);
  const queryClient = useQueryClient();
  const logout = async () => {
    await logoutUser();
    queryClient.clear();
    setUser(null);
    window.location.assign("/login");
  };
  return <AuthContext.Provider value={{ user, setUser, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
};