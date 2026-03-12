"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  isLoggedIn: boolean;
  isLoading: boolean;
  email: string;
  userId: string | null;
};

const AuthContext = createContext<AuthContextValue>({ isLoggedIn: false, isLoading: true, email: "", userId: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // getSession()はcookieのJWT読み取りで即座に完了（getUser()はネットワーク往復~1.5秒）
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
      setEmail(session?.user?.email ?? "");
      setUserId(session?.user?.id ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      setEmail(session?.user?.email ?? "");
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, email, userId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
