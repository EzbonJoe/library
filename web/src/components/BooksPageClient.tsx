"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { isBookBookmarked, toggleBookBookmark } from "@/lib/bookBookmarks";
import { bookLink } from "@/lib/bookLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import type { Book, BookStats } from "@/lib/bookStats";
import { CATEGORIES } from "@/lib/categories";

const RECENTLY_VIEWED_KEY = "gadzeke-recently-viewed";

function bookLinkFor(book: Book) {
  return book.status === "coming_soon" ? "/coming-soon" : bookLink(book.slug);
}

function getRecentlyViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]") || [];
  } catch {
    return [];
  }
}

function BookCard({ book, stats }: { book: Book; stats: BookStats | undefined }) {
  // localStorage doesn't exist during server rendering — start at "not
  // saved" (matching the server) and sync the real value after mount, so
  // this doesn't hydration-mismatch for any visitor who's actually saved
  // this book.
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(isBookBookmarked(book.slug));
  }, [book.slug]);
  const count = stats?.count ?? 0;

  return (
    <Link className="book-card" href={bookLinkFor(book)}>
      <div className="book-card-cover-wrap">
        <Image
          className="book-card-cover"
          src={resolveCoverUrl(book.image)}
          alt={`${book.title} cover`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
          loading="lazy"
        />
        {(stats?.isNew || stats?.hasEditorsPick) && (
          <div className="book-card-badges">
            {stats?.isNew && <span className="book-badge book-badge--new">New</span>}
            {stats?.hasEditorsPick && <span className="book-badge book-badge--pick">Pick</span>}
          </div>
        )}
        <button
          type="button"
          className={`book-card-save-btn ${saved ? "is-saved" : ""}`}
          aria-label="Save this book"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setSaved(toggleBookBookmark(book.slug));
          }}
        >
          {/* gz-tooltip's own nested span, not the button itself — see
              PasswordInput's identical comment for why: .gz-tooltip's plain
              CSS position:relative would silently beat .book-card-save-btn's
              own position:absolute if they landed on the same element,
              depending on CSS bundling order. Not worth relying on. */}
          <span className="gz-tooltip">
            {saved ? "★" : "☆"}
            {/* --below: the cover-wrap ancestor clips overflow, and this
                button sits too close to its top edge for the default
                upward-pointing bubble to actually be visible. --align-end:
                the button also sits close to the cover's right edge, so the
                default center-aligned bubble (wider than the button) would
                have its right half clipped by that same overflow:hidden
                ancestor — right-aligning it keeps it growing leftward. */}
            <span className="gz-tooltip-bubble gz-tooltip-bubble--below gz-tooltip-bubble--align-end" aria-hidden="true">
              {saved ? "Remove from saved" : "Save this book"}
            </span>
          </span>
        </button>
        <div className="book-card-cta">Read Quotes →</div>
      </div>
      <div className="book-card-title">{book.title}</div>
      {book.author && <div className="book-card-author">{book.author}</div>}
      <div className="book-card-meta">
        {count} Quote{count === 1 ? "" : "s"}
      </div>
    </Link>
  );
}

function BookRow({ title, books, statsMap }: { title: string; books: Book[]; statsMap: Map<number, BookStats> }) {
  if (books.length === 0) return null;
  return (
    <section className="book-row-section">
      <h2 className="book-row-heading">{title}</h2>
      <div className="book-row">
        {books.map((book) => (
          <BookCard key={book.id} book={book} stats={statsMap.get(book.id)} />
        ))}
      </div>
    </section>
  );
}

export default function BooksPageClient({
  books,
  statsEntries,
  initialSearch,
  initialSaved,
}: {
  books: Book[];
  statsEntries: [number, BookStats][];
  initialSearch: string;
  initialSaved: boolean;
}) {
  const statsMap = useMemo(() => new Map(statsEntries), [statsEntries]);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("");
  const [savedOnly, setSavedOnly] = useState(initialSaved);
  const [sort, setSort] = useState<"newest" | "alphabetical" | "most-quotes">("newest");
  // Same server/client mismatch as BookCard's `saved` state above — start
  // empty (matching the server, which has no localStorage) and sync after
  // mount.
  const [recentlyViewedSlugs, setRecentlyViewedSlugs] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentlyViewedSlugs(getRecentlyViewed());
  }, []);

  const published = useMemo(() => books.filter((book) => book.status !== "coming_soon"), [books]);
  const featuredPool = useMemo(() => published.filter((book) => book.featured), [published]);

  const isSearchMode = search.trim() !== "" || category !== "" || savedOnly;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return books.filter((book) => {
      const matchesCategory = !category || book.category === category;
      const matchesSearch =
        !term || book.title.toLowerCase().includes(term) || (book.author ?? "").toLowerCase().includes(term);
      const matchesSaved = !savedOnly || isBookBookmarked(book.slug);
      return matchesCategory && matchesSearch && matchesSaved;
    });
  }, [books, search, category, savedOnly]);

  const results = useMemo(() => {
    const sorted = [...filtered];
    if (sort === "alphabetical") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "most-quotes")
      sorted.sort((a, b) => (statsMap.get(b.id)?.count ?? 0) - (statsMap.get(a.id)?.count ?? 0));
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return sorted;
  }, [filtered, sort, statsMap]);

  // eslint-disable-next-line react-hooks/purity -- intentional day-based rotation, not cacheable render output
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  const heroBook = featuredPool.length > 0 ? featuredPool[daysSinceEpoch % featuredPool.length] : null;
  const heroStats = heroBook ? statsMap.get(heroBook.id) : undefined;

  const editorialPool = featuredPool.length > 1 ? featuredPool.filter((b) => b.id !== heroBook?.id) : featuredPool;
  const editorialBook = editorialPool.length > 0 ? editorialPool[(daysSinceEpoch + 1) % editorialPool.length] : null;
  const editorialStats = editorialBook ? statsMap.get(editorialBook.id) : undefined;

  const recentlyAdded = useMemo(
    () =>
      [...published]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8),
    [published],
  );

  const categoryRows = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        category: cat.name,
        icon: cat.icon,
        books: published.filter((b) => b.category === cat.name),
      })).filter((entry) => entry.books.length > 0),
    [published],
  );

  const recentlyViewedBooks = useMemo(
    () => recentlyViewedSlugs.map((slug) => published.find((b) => b.slug === slug)).filter(Boolean) as Book[],
    [recentlyViewedSlugs, published],
  );

  const suggestions = useMemo(() => {
    if (results.length > 0) return [];
    // eslint-disable-next-line react-hooks/purity -- empty-state suggestions are intentionally randomized per render
    return published.slice().sort(() => Math.random() - 0.5).slice(0, 4);
  }, [results, published]);

  return (
    <>
      <section className="hero">
        <h1 className="hero-heading">Browse All Books</h1>
        <p className="hero-subtext">
          Search the full library by title or author, or narrow it down by category below.
        </p>
        <div className="hero-search">
          <input
            type="text"
            className="hero-search-input"
            placeholder="Search books, authors..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      <div className="chip-bar">
        <button type="button" className={`chip ${category === "" ? "is-active" : ""}`} onClick={() => setCategory("")}>
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            type="button"
            className={`chip ${category === cat.name ? "is-active" : ""}`}
            onClick={() => setCategory(cat.name)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="feed-toolbar">
        <button
          type="button"
          className={`bookmark-toggle ${savedOnly ? "is-active" : ""}`}
          onClick={() => setSavedOnly((v) => !v)}
        >
          🔖 Saved Books
        </button>
      </div>

      {!isSearchMode ? (
        <div>
          {heroBook && (
            <section className="featured">
              {/* Same LCP fix as HomeFeed's hero -- a CSS background-image
                  here was serving the raw, unoptimized cover file instead
                  of going through next/image. */}
              <Image
                className="featured-bg-image"
                src={resolveCoverUrl(heroBook.image)}
                alt=""
                fill
                priority
                sizes="100vw"
              />
              <div className="featured-overlay" />
              <div className="featured-content">
                <span className="featured-label">Featured Book</span>
                <Image
                  className="featured-cover"
                  src={resolveCoverUrl(heroBook.image)}
                  alt={`${heroBook.title} cover`}
                  width={96}
                  height={144}
                  priority
                />
                <p className="featured-quote">
                  {heroStats?.sampleQuote ? `"${heroStats.sampleQuote}"` : heroBook.title}
                </p>
                <div className="featured-book">
                  {heroBook.title}
                  {heroBook.author ? ` — ${heroBook.author}` : ""}
                </div>
                <div className="featured-stat">
                  {heroStats?.count ?? 0} Quote{(heroStats?.count ?? 0) === 1 ? "" : "s"} Available
                </div>
                <Link className="featured-cta" href={bookLinkFor(heroBook)}>
                  Read Quotes →
                </Link>
              </div>
            </section>
          )}

          <BookRow title="Recently Added" books={recentlyAdded} statsMap={statsMap} />
          {categoryRows.slice(0, 2).map((entry) => (
            <BookRow key={entry.category} title={`${entry.icon} ${entry.category}`} books={entry.books} statsMap={statsMap} />
          ))}

          {editorialBook && (
            <section className="editorial-breakout">
              <Image
                className="editorial-breakout-cover"
                src={resolveCoverUrl(editorialBook.image)}
                alt={`${editorialBook.title} cover`}
                width={400}
                height={600}
                sizes="(max-width: 640px) 140px, 400px"
              />
              <div>
                <span className="editorial-breakout-label">Editor&apos;s Pick of the Week</span>
                <h2 className="editorial-breakout-title">{editorialBook.title}</h2>
                {editorialStats?.sampleQuote && (
                  <p className="editorial-breakout-quote">&quot;{editorialStats.sampleQuote}&quot;</p>
                )}
                {editorialBook.description && <p className="quote-card-author">{editorialBook.description}</p>}
                <Link className="featured-cta" href={bookLinkFor(editorialBook)}>
                  Read Quotes →
                </Link>
              </div>
            </section>
          )}

          {categoryRows.slice(2).map((entry) => (
            <BookRow key={entry.category} title={`${entry.icon} ${entry.category}`} books={entry.books} statsMap={statsMap} />
          ))}

          {recentlyViewedBooks.length > 0 && (
            <BookRow title="Continue Exploring" books={recentlyViewedBooks} statsMap={statsMap} />
          )}
        </div>
      ) : (
        <div>
          <div className="books-toolbar">
            <label htmlFor="books-sort">Sort by</label>
            <select
              id="books-sort"
              className="sort-select"
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
            >
              <option value="newest">Newest</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="most-quotes">Most Quotes</option>
            </select>
          </div>

          {results.length > 0 ? (
            <div className="browse-grid">
              {results.map((book) => (
                <BookCard key={book.id} book={book} stats={statsMap.get(book.id)} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📖</div>
              <p>
                {search
                  ? `Nothing matches "${search}" yet — try a broader search, or browse by category instead.`
                  : savedOnly
                    ? "Nothing saved yet — the bookmark icon on any book saves it here."
                    : "Nothing here yet — try a different category."}
              </p>
              <Link className="empty-state-cta" href="/books">
                Clear search
              </Link>

              {suggestions.length > 0 && (
                <div>
                  <h2 className="book-row-heading">You might like these instead</h2>
                  <div className="browse-grid">
                    {suggestions.map((book) => (
                      <BookCard key={book.id} book={book} stats={statsMap.get(book.id)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
