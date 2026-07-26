import type { SupabaseClient } from "@supabase/supabase-js";
import { getBookmarks } from "./bookmarks";

// Mirrors a localStorage bookmark toggle to the logged-in user's account, so
// it follows them across devices — best-effort and fire-and-forget: the
// localStorage toggle (QuoteCard/BookQuotesSection) is the source of truth
// for instant UI feedback and works with or without an account, this is
// purely an additive sync on top of it.
export function syncSavedQuote(supabase: SupabaseClient, ownerId: string, quoteId: number, saved: boolean) {
  if (saved) {
    supabase.from("saved_quotes").insert({ owner_id: ownerId, quote_id: quoteId }).then(() => {});
  } else {
    supabase.from("saved_quotes").delete().eq("owner_id", ownerId).eq("quote_id", quoteId).then(() => {});
  }
}

// One-time upload of whatever this browser already had bookmarked in
// localStorage before account syncing existed, so those bookmarks show up
// in Saved Quotes immediately instead of only future ones. Safe to call on
// every dashboard visit — the unique(owner_id, quote_id) constraint makes
// re-uploading the same ids a no-op.
export async function syncLocalBookmarksToAccount(supabase: SupabaseClient, ownerId: string) {
  const ids = getBookmarks();
  if (ids.length === 0) return;
  await supabase
    .from("saved_quotes")
    .upsert(
      ids.map((quote_id) => ({ owner_id: ownerId, quote_id })),
      { onConflict: "owner_id,quote_id", ignoreDuplicates: true },
    );
}

export type SavedQuote = {
  quote_id: number;
  text: string;
  editors_pick: boolean;
  book: { title: string; image: string; author: string | null; category: string | null; slug: string };
};

export async function loadSavedQuotes(supabase: SupabaseClient, ownerId: string): Promise<SavedQuote[]> {
  const { data } = await supabase
    .from("saved_quotes")
    .select("quote_id, quote:quotes(id, text, editors_pick, book:books(title, image, author, category, slug))")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data
    .map((row) => {
      const quote = row.quote as unknown as {
        text: string;
        editors_pick: boolean;
        book: { title: string; image: string; author: string | null; category: string | null; slug: string };
      } | null;
      if (!quote) return null;
      return { quote_id: row.quote_id, text: quote.text, editors_pick: quote.editors_pick, book: quote.book };
    })
    .filter((row): row is SavedQuote => row !== null);
}
