"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";

export type MeUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

const DashboardMeContext = createContext<MeUser | null | undefined>(undefined);

export function DashboardSessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeUser | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await apiJson<{ user: MeUser }>("/api/auth/me");
        if (alive) setMe(r.user);
      } catch {
        if (alive) setMe(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return <DashboardMeContext.Provider value={me}>{children}</DashboardMeContext.Provider>;
}

/** `undefined` = loading, `null` = unauthenticated / error */
export function useDashboardMe(): MeUser | null | undefined {
  return useContext(DashboardMeContext);
}
