import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // During build-time prerendering, env vars may not be available.
  // Return the singleton instance only when running in a real environment.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a minimal stub during build-time prerendering.
    // This will be replaced with a real client when the app runs in production.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { auth: { signInWithPassword: async () => ({ error: null }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), getUser: async () => ({ data: { user: null } }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }), channel: () => ({ on: () => ({ subscribe: () => {} }) }), removeChannel: () => {} } as any;
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(url, key);
  }
  return clientInstance;
}
