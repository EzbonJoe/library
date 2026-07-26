import type { SupabaseClient } from "@supabase/supabase-js";
import { getBookBookmarks } from "./bookBookmarks";

// Mirrors a localStorage whole-book bookmark toggle to the logged-in user's
// account, so it follows them across devices -- same fire-and-forget
// approach as lib/savedQuotes.ts's syncSavedQuote.
export function syncSavedBook(supabase: SupabaseClient, ownerId: string, slug: string, saved: boolean) {
  if (saved) {
    supabase.from("saved_books").insert({ owner_id: ownerId, book_slug: slug }).then(() => {});
  } else {
    supabase.from("saved_books").delete().eq("owner_id", ownerId).eq("book_slug", slug).then(() => {});
  }
}

// One-time upload of whatever this browser already had book-bookmarked in
// localStorage before account syncing existed -- safe to call on every
// dashboard visit, the unique(owner_id, book_slug) constraint makes
// re-uploading the same slugs a no-op.
export async function syncLocalBookBookmarksToAccount(supabase: SupabaseClient, ownerId: string) {
  const slugs = getBookBookmarks();
  if (slugs.length === 0) return;
  await supabase
    .from("saved_books")
    .upsert(
      slugs.map((book_slug) => ({ owner_id: ownerId, book_slug })),
      { onConflict: "owner_id,book_slug", ignoreDuplicates: true },
    );
}

export type SavedBook = { slug: string; title: string; image: string; author: string | null; category: string | null };

export async function loadSavedBooks(supabase: SupabaseClient, ownerId: string): Promise<SavedBook[]> {
  const { data } = await supabase
    .from("saved_books")
    .select("created_at, book:books(slug, title, image, author, category)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data
    .map((row) => row.book as unknown as SavedBook | null)
    .filter((book): book is SavedBook => book !== null);
}
