"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/domain";

interface AuthUser {
  id: string;
  email: string | undefined;
  role: UserRole | null;
  displayName: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, display_name")
        .eq("user_id", authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email,
        role: profile?.role ?? null,
        displayName: profile?.display_name ?? null,
      });
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return { user, loading, signOut };
}
