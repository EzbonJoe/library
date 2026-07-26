import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// No cookie access, so pages using this stay statically generatable /
// ISR-able. Use this for public content reads (books, quotes, feed);
// reserve lib/supabase/server.ts (cookie-bound) for auth-gated reads.
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
