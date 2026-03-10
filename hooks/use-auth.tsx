"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthContextValue = {
  isLoggedIn: boolean;
  isLoading: boolean;
  email: string;
};

const AuthContext = createContext<AuthContextValue>({ isLoggedIn: false, isLoading: true, email: "" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();

    // getSession()はcookieのJWT読み取りで即座に完了（getUser()はネットワーク往復~1.5秒）
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
      setEmail(session?.user?.email ?? "");
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      setEmail(session?.user?.email ?? "");
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, email }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
