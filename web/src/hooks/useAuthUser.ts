"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/profile";

// Shared auth-state tracking so the header's account link and its logout
// control don't each run their own independent Supabase auth listener.
export function useAuthUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        const profile = await ensureProfile(supabase, sessionUser);
        setUsername(profile?.username ?? null);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const profile = await ensureProfile(supabase, session.user);
        setUsername(profile?.username ?? null);
      } else {
        setUsername(null);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { user, username };
}
