import { useEffect, useState } from "react";

export type Session = {
  userId: string;
  displayName: string;
};

const STORAGE_KEY = "nexus-core-session";

export function useSession() {
  const [session, setSession] = useState<Session | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as Session;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  return { session, setSession, clearSession };
}