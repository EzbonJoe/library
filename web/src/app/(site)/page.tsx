import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/public";
import HomeFeed, { type HeroData, type SidebarBook } from "@/components/HomeFeed";
import type { FeedQuote } from "@/components/QuoteCard";
import { interleaveByBook } from "@/lib/interleaveByBook";

export const revalidate = 60;

const description =
  "Discover timeless, hand-picked quotes from the world's greatest business, psychology, and philosophy books — curated by GadZeke, not AI-generated.";

export const metadata: Metadata = {
  title: "GadZeke — Words That Change Perspectives",
  description,
  alternates: { canonical: "/" },
  openGraph: { title: "GadZeke — Words That Change Perspectives", description, url: "/" },
};

// Must match HomeFeed's DISPLAY_BATCH/FETCH_WINDOW — see the comment there
// for why these differ (diversity pool vs. what actually renders).
const DISPLAY_BATCH = 12;
const FETCH_WINDOW = 200;

type HeroQuote = NonNullable<HeroData>["quote"];

export type SiteStats = { quotes: number; books: number; authors: number };

async function loadStats(supabase: ReturnType<typeof createClient>): Promise<SiteStats> {
  const [{ count: quotes }, { count: books }, { data: authorRows }] = await Promise.all([
    supabase.from("quotes").select("id", { count: "exact", head: true }),
    supabase.from("books").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("books").select("author").not("author", "is", null),
  ]);

  const authors = new Set((authorRows ?? []).map((row) => row.author)).size;

  return { quotes: quotes ?? 0, books: books ?? 0, authors };
}

async function loadHero(supabase: ReturnType<typeof createClient>): Promise<HeroData> {
  const { count } = await supabase.from("quotes").select("id", { count: "exact", head: true }).eq("editors_pick", true);

  if (count && count > 0) {
    const daysSinceEpoch = Math.floor(Date.now() / 86400000);
    const dayIndex = daysSinceEpoch % count;

    const { data } = await supabase
      .from("quotes")
      .select("text, book:books(title, image, author, slug)")
      .eq("editors_pick", true)
      .order("id")
      .range(dayIndex, dayIndex);

    const quote = data?.[0] as unknown as HeroQuote | undefined;
    if (quote) return { label: "Quote of the Day", quote };
  }

  const { data: featured } = await supabase
    .from("quotes")
    .select("text, book:books(title, image, author, slug)")
    .eq("featured", true)
    .limit(1)
    .maybeSingle();

  if (!featured) return null;
  return { label: "Featured Quote", quote: featured as unknown as HeroQuote };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; author?: string; search?: string; bookmarked?: string }>;
}) {
  const { category = "", author = "", search = "", bookmarked } = await searchParams;
  const bookmarkedOnly = bookmarked === "true";
  const supabase = createClient();

  let quotesQuery = supabase
    .from("quotes")
    .select("id, text, editors_pick, book:books!inner(title, image, author, category, slug)");

  if (category) quotesQuery = quotesQuery.eq("book.category", category);
  if (author) quotesQuery = quotesQuery.eq("book.author", author);
  if (search) quotesQuery = quotesQuery.ilike("text", `%${search}%`);
  // Bookmarks are localStorage-only (no server-side identity for a visitor),
  // so an initial ?bookmarked=true page load can't be resolved server-side —
  // HomeFeed re-fetches client-side once it can read localStorage.
  const skipInitialFetch = bookmarkedOnly;

  const [{ data: quotes }, { data: recentQuotes }, { data: authorBooks }, hero, stats] = await Promise.all([
    skipInitialFetch
      ? Promise.resolve({ data: [] as unknown[] })
      : quotesQuery.order("created_at", { ascending: false }).range(0, FETCH_WINDOW - 1),
    supabase.from("quotes").select("book:books(title, image, slug)").order("created_at", { ascending: false }).limit(5),
    supabase.from("books").select("author").not("author", "is", null).order("author"),
    loadHero(supabase),
    loadStats(supabase),
  ]);

  const interleaved = interleaveByBook((quotes ?? []) as unknown as FeedQuote[]);
  const initialQuotes = interleaved.slice(0, DISPLAY_BATCH);
  const initialBuffer = interleaved.slice(DISPLAY_BATCH);
  const fetchedFullWindow = (quotes?.length ?? 0) === FETCH_WINDOW;

  const recentlyAdded: SidebarBook[] = (recentQuotes ?? [])
    .map((q) => (q as unknown as { book: SidebarBook }).book)
    .filter(Boolean);
  const authors = [...new Set((authorBooks ?? []).map((b) => b.author).filter((a): a is string => Boolean(a)))].slice(
    0,
    8,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "GadZeke",
            url: "https://gadzeke.com/",
            description,
            potentialAction: {
              "@type": "SearchAction",
              target: "https://gadzeke.com/books?search={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "GadZeke",
            url: "https://gadzeke.com/",
            logo: "https://gadzeke.com/icons/logo-social.png",
            founder: { "@type": "Person", name: "Rami Zeke" },
            sameAs: ["https://www.youtube.com/@RamiZeke", "https://instagram.com/gadzeke"],
          }),
        }}
      />
      <HomeFeed
        initialQuotes={initialQuotes}
        initialBuffer={initialBuffer}
        initialHasMore={initialBuffer.length > 0 || fetchedFullWindow}
        hero={hero}
        stats={stats}
        recentlyAdded={recentlyAdded}
        authors={authors}
        initialFilters={{ category, author, search, bookmarked: bookmarkedOnly }}
      />
    </>
  );
}
