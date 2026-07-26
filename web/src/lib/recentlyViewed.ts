import type { SupabaseClient } from "@supabase/supabase-js";

// Fire-and-forget, called once per book-page visit from BookQuotesSection --
// upserting on (owner_id, book_slug) bumps viewed_at on a revisit instead of
// growing a new row every time, so "recently viewed" always reflects the
// last time this book was actually opened.
export function recordBookView(supabase: SupabaseClient, ownerId: string, slug: string) {
  supabase
    .from("book_views")
    .upsert({ owner_id: ownerId, book_slug: slug, viewed_at: new Date().toISOString() }, { onConflict: "owner_id,book_slug" })
    .then(() => {});
}

export type RecentlyViewedBook = {
  slug: string;
  title: string;
  image: string;
  author: string | null;
  category: string | null;
  viewed_at: string;
};

export async function loadRecentlyViewed(
  supabase: SupabaseClient,
  ownerId: string,
  limit = 24,
): Promise<RecentlyViewedBook[]> {
  const { data } = await supabase
    .from("book_views")
    .select("viewed_at, book:books(slug, title, image, author, category)")
    .eq("owner_id", ownerId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data
    .map((row) => {
      const book = row.book as unknown as {
        slug: string;
        title: string;
        image: string;
        author: string | null;
        category: string | null;
      } | null;
      if (!book) return null;
      return { ...book, viewed_at: row.viewed_at };
    })
    .filter((row): row is RecentlyViewedBook => row !== null);
}

export async function removeRecentlyViewed(supabase: SupabaseClient, ownerId: string, slug: string) {
  await supabase.from("book_views").delete().eq("owner_id", ownerId).eq("book_slug", slug);
}

export async function clearRecentlyViewed(supabase: SupabaseClient, ownerId: string) {
  await supabase.from("book_views").delete().eq("owner_id", ownerId);
}
