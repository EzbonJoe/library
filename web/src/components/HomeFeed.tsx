"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { bookLink } from "@/lib/bookLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import { getBookmarks } from "@/lib/bookmarks";
import { BOOKMARK_TOGGLE_CLICK_EVENT } from "@/lib/events";
import { interleaveByBook } from "@/lib/interleaveByBook";
import { CATEGORIES } from "@/lib/categories";
import QuoteCard, { type FeedQuote } from "./QuoteCard";

// How many cards get appended to the visible feed per scroll trigger.
const DISPLAY_BATCH = 12;
// How many rows get pulled from the DB per network call — much wider than
// DISPLAY_BATCH on purpose. Bulk-adding quotes in admin stamps a whole
// pasted batch with the same created_at, so one book can dominate 40+
// consecutive rows in recency order; the fetch window needs to be wide
// enough to reliably contain more than one book to actually interleave.
// The extra rows beyond DISPLAY_BATCH are kept in a client-side buffer and
// drawn down on later scroll triggers, so this doesn't inflate page weight
// the way just rendering 200 cards at once would.
const FETCH_WINDOW = 200;


export type HeroData = {
  label: string;
  quote: { text: string; book: { title: string; image: string; author: string | null; slug: string } };
} | null;

export type SidebarBook = { slug: string; title: string; image: string };

export type SiteStats = { quotes: number; books: number; authors: number };

function formatStat(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k+` : `${value}+`;
}

function cardVariant(renderedIndex: number): "default" | "large" | "spotlight" {
  if (renderedIndex % 7 === 0) return "spotlight";
  if (renderedIndex % 4 === 0) return "large";
  return "default";
}

export default function HomeFeed({
  initialQuotes,
  initialBuffer,
  initialHasMore,
  hero,
  stats,
  recentlyAdded,
  authors,
  initialFilters,
}: {
  initialQuotes: FeedQuote[];
  initialBuffer: FeedQuote[];
  initialHasMore: boolean;
  hero: HeroData;
  stats: SiteStats;
  recentlyAdded: SidebarBook[];
  authors: string[];
  initialFilters: { category: string; author: string; search: string; bookmarked: boolean };
}) {
  const [category, setCategory] = useState(initialFilters.category);
  const [author, setAuthor] = useState(initialFilters.author);
  const [search, setSearch] = useState(initialFilters.search);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(initialFilters.bookmarked);

  const [quotes, setQuotes] = useState(initialQuotes);
  const [isLoading, setIsLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Not-yet-displayed interleaved quotes from the last DB fetch, and how
  // many rows into the current filter's result set that fetch reached —
  // refs because updating them shouldn't itself trigger a render.
  const bufferRef = useRef<FeedQuote[]>(initialBuffer);
  const dbOffsetRef = useRef(initialQuotes.length + initialBuffer.length);
  const hasMoreInDbRef = useRef(initialHasMore);

  const stateRef = useRef({ category, author, search, bookmarkedOnly, isLoading });
  useEffect(() => {
    stateRef.current = { category, author, search, bookmarkedOnly, isLoading };
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isFilterActive = category !== "" || author !== "" || search !== "" || bookmarkedOnly;

  const loadMore = useCallback(async (filters: typeof stateRef.current, isReset: boolean) => {
    if (isReset) {
      bufferRef.current = [];
      dbOffsetRef.current = 0;
      hasMoreInDbRef.current = true;
    }

    if (filters.bookmarkedOnly && getBookmarks().length === 0) {
      setShowSkeleton(false);
      if (isReset) setQuotes([]);
      return;
    }

    // Serve the next batch straight from the buffer when there's enough
    // (or nothing more to fetch) — no network round trip needed.
    if (bufferRef.current.length >= DISPLAY_BATCH || (!hasMoreInDbRef.current && bufferRef.current.length > 0)) {
      const batch = bufferRef.current.splice(0, DISPLAY_BATCH);
      setQuotes((prev) => (isReset ? batch : [...prev, ...batch]));
      return;
    }

    if (!hasMoreInDbRef.current) {
      setShowSkeleton(false);
      if (isReset) setQuotes([]);
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    let query = supabase
      .from("quotes")
      .select("id, text, editors_pick, book:books!inner(title, image, author, category, slug)");

    if (filters.category) query = query.eq("book.category", filters.category);
    if (filters.author) query = query.eq("book.author", filters.author);
    if (filters.search) query = query.ilike("text", `%${filters.search}%`);
    if (filters.bookmarkedOnly) query = query.in("id", getBookmarks());

    const from = dbOffsetRef.current;
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + FETCH_WINDOW - 1);

    setIsLoading(false);
    setShowSkeleton(false);

    if (error || !data) return;

    dbOffsetRef.current += data.length;
    hasMoreInDbRef.current = data.length === FETCH_WINDOW;
    bufferRef.current.push(...interleaveByBook(data as unknown as FeedQuote[]));

    const batch = bufferRef.current.splice(0, DISPLAY_BATCH);
    setQuotes((prev) => (isReset ? batch : [...prev, ...batch]));
  }, []);

  function resetAndLoad(next: Partial<typeof stateRef.current>) {
    const merged = { ...stateRef.current, ...next };
    stateRef.current = merged;
    setShowSkeleton(true);
    loadMore(merged, true);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !stateRef.current.isLoading && hasMoreCurrent()) {
          loadMore(stateRef.current, false);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();

    // Read straight from the refs rather than reactive state — this only
    // gates whether the observer fires another load, not anything rendered.
    function hasMoreCurrent() {
      return bufferRef.current.length > 0 || hasMoreInDbRef.current;
    }
  }, [loadMore]);

  useEffect(() => {
    function handleBookmarkToggleClick() {
      const next = !stateRef.current.bookmarkedOnly;
      setBookmarkedOnly(next);
      resetAndLoad({ bookmarkedOnly: next });
    }
    window.addEventListener(BOOKMARK_TOGGLE_CLICK_EVENT, handleBookmarkToggleClick);
    return () => window.removeEventListener(BOOKMARK_TOGGLE_CLICK_EVENT, handleBookmarkToggleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChipClick(cat: string) {
    setCategory(cat);
    setAuthor("");
    resetAndLoad({ category: cat, author: "" });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      resetAndLoad({ search: value.trim(), author: "" });
    }, 300);
  }

  function handleBookmarkToggleClick() {
    const next = !bookmarkedOnly;
    setBookmarkedOnly(next);
    resetAndLoad({ bookmarkedOnly: next });
  }

  function handleAuthorFilter(selectedAuthor: string) {
    setAuthor(selectedAuthor);
    setCategory("");
    setSearch("");
    resetAndLoad({ author: selectedAuthor, category: "", search: "" });
  }

  return (
    <main className="feed-main">
      <section className="hero">
        <h1 className="hero-heading">Words That Change Perspectives</h1>
        <p className="hero-subtext">Discover timeless wisdom from the world&apos;s greatest books.</p>
        <div className="hero-search">
          <input
            type="text"
            className="hero-search-input"
            placeholder="Search quotes, books, authors..."
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </div>
        <div className="hero-cta-row">
          <button
            type="button"
            className="hero-cta-primary"
            onClick={() => document.getElementById("feed")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Explore Quotes
          </button>
          <Link href="/books" className="hero-cta-secondary">
            Browse Books
          </Link>
        </div>
        <div className="hero-stats">
          <span>
            <span className="hero-stat-value">{formatStat(stats.quotes)}</span> Quotes
          </span>
          <span className="hero-stat-divider" aria-hidden="true" />
          <span>
            <span className="hero-stat-value">{formatStat(stats.books)}</span> Books
          </span>
          <span className="hero-stat-divider" aria-hidden="true" />
          <span>
            <span className="hero-stat-value">{formatStat(stats.authors)}</span> Authors
          </span>
        </div>
      </section>

      <div className="chip-bar" id="feed">
        <button type="button" className={`chip ${category === "" ? "is-active" : ""}`} onClick={() => handleChipClick("")}>
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            type="button"
            className={`chip ${category === cat.name ? "is-active" : ""}`}
            onClick={() => handleChipClick(cat.name)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {hero && !isFilterActive && (
        <section className="featured" style={{ backgroundImage: `url('${resolveCoverUrl(hero.quote.book.image)}')` }}>
          <div className="featured-overlay" />
          <div className="featured-content">
            <span className="featured-label">{hero.label}</span>
            <Image
              className="featured-cover"
              src={resolveCoverUrl(hero.quote.book.image)}
              alt={`${hero.quote.book.title} cover`}
              width={96}
              height={144}
            />
            <p className="featured-quote">{hero.quote.text}</p>
            <div className="featured-book">
              {hero.quote.book.title} — {hero.quote.book.author ?? ""}
            </div>
            <Link className="featured-cta" href={bookLink(hero.quote.book.slug)}>
              Read More From This Book
            </Link>
          </div>
        </section>
      )}

      <div className="feed-layout">
        <div className="feed-column">
          <div className="feed-toolbar">
            <button
              type="button"
              className={`bookmark-toggle ${bookmarkedOnly ? "is-active" : ""}`}
              onClick={handleBookmarkToggleClick}
            >
              🔖 Bookmarked only
            </button>
          </div>

          {showSkeleton && (
            <div className="skeleton-grid">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          )}

          {!showSkeleton && quotes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📖</div>
              <p>
                {bookmarkedOnly
                  ? "Nothing bookmarked yet — the star on any quote saves it here."
                  : search
                    ? `Nothing matches "${search}" yet — try a broader search, or let a category surprise you.`
                    : "Nothing here yet — try a different category, or explore the full library."}
              </p>
              <Link className="empty-state-cta" href="/books">
                Explore Books
              </Link>
            </div>
          ) : (
            <div className="quote-grid">
              {quotes.map((quote, index) => (
                <QuoteCard key={quote.id} quote={quote} variant={cardVariant(index + 1)} />
              ))}
            </div>
          )}

          <div ref={sentinelRef} />
        </div>

        <aside className="feed-sidebar">
          <div className="sidebar-block">
            <h3>Recently Added</h3>
            <div>
              {recentlyAdded.map((book, index) => (
                // Same book can legitimately appear more than once here —
                // this lists the books behind the 5 most recent quotes, not
                // distinct books, so the key includes the index.
                <Link key={`${book.slug}-${index}`} className="sidebar-item" href={bookLink(book.slug)}>
                  <Image src={resolveCoverUrl(book.image)} alt="" width={28} height={40} loading="lazy" />
                  <span>{book.title}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="sidebar-block">
            <h3>Authors to Explore</h3>
            <div>
              {authors.map((a) => (
                <button key={a} type="button" className="sidebar-item" onClick={() => handleAuthorFilter(a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
