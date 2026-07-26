import type { SupabaseClient, User } from "@supabase/supabase-js";

export type Profile = { id: string; username: string; display_name: string | null; bio: string | null };

// Called after any successful sign-in. Supabase's email-confirmation setting
// determines whether a session exists immediately after signUp() or only
// after the visitor confirms their email and logs in — rather than branch on
// that, the chosen username/display name travel in the auth user's metadata
// (set at signUp time) and the profile row gets created lazily on whichever
// authenticated session sees it's missing first.
export async function ensureProfile(supabase: SupabaseClient, user: User): Promise<Profile | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const username = user.user_metadata?.username;
  if (!username) return null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username,
      display_name: user.user_metadata?.display_name || null,
    })
    .select("id, username, display_name, bio")
    .single();

  return error ? null : data;
}
