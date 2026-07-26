"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { bookLink } from "@/lib/bookLink";

const RECENT_KEY = "gadzeke-recent-searches";
const POPULAR_BOOKS_LIMIT = 4;
export const TOGGLE_SEARCH_EVENT = "gadzeke:toggle-search";

type BookResult = { title: string; author: string | null; slug: string };
type QuoteResult = { id: number; text: string; book: { title: string; slug: string } };

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") || [];
  } catch {
    return [];
  }
}

function addRecentSearch(term: string) {
  const trimmed = term.trim();
  if (!trimmed) return;
  const existing = getRecentSearches().filter(
    (entry) => entry.toLowerCase() !== trimmed.toLowerCase(),
  );
  existing.unshift(trimmed);
  localStorage.setItem(RECENT_KEY, JSON.stringify(existing.slice(0, 5)));
}

export default function SearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const [popularBooks, setPopularBooks] = useState<BookResult[]>([]);
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  const [quoteResults, setQuoteResults] = useState<QuoteResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isOpenRef = useRef(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    isOpenRef.current = isOpen;
    document.body.classList.toggle("search-open", isOpen);
  }, [isOpen]);

  function openOverlay() {
    setTerm("");
    setHasSearched(false);
    setRecents(getRecentSearches());
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());

    supabase
      .from("books")
      .select("title, author, slug")
      .order("created_at", { ascending: false })
      .limit(POPULAR_BOOKS_LIMIT)
      .then(({ data }) => setPopularBooks(data ?? []));
  }

  function closeOverlay() {
    setIsOpen(false);
  }

  useEffect(() => {
    function toggle() {
      if (isOpenRef.current) closeOverlay();
      else openOverlay();
    }
    function handleKeydown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        toggle();
      }
      if (event.key === "Escape" && isOpenRef.current) {
        closeOverlay();
      }
    }
    window.addEventListener(TOGGLE_SEARCH_EVENT, toggle);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener(TOGGLE_SEARCH_EVENT, toggle);
      document.removeEventListener("keydown", handleKeydown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runSearch(value: string) {
    setTerm(value);
    clearTimeout(searchTimer.current);

    if (!value.trim()) {
      setHasSearched(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      const [{ data: quotes }, { data: books }] = await Promise.all([
        supabase
          .from("quotes")
          .select("id, text, book:books(title, slug)")
          .ilike("text", `%${value}%`)
          .limit(5),
        supabase.from("books").select("title, author, slug").ilike("title", `%${value}%`).limit(5),
      ]);
      setQuoteResults(
        // Supabase types the joined `book` as an array; it's a single row here.
        ((quotes ?? []) as unknown as { id: number; text: string; book: { title: string; slug: string } }[]),
      );
      setBookResults(books ?? []);
      setHasSearched(true);
    }, 250);
  }

  function goToSearch(value: string) {
    addRecentSearch(value);
    closeOverlay();
    router.push(`/?search=${encodeURIComponent(value)}`);
  }

  function handleRecentClick(recentTerm: string) {
    setTerm(recentTerm);
    runSearch(recentTerm);
  }

  const showResults = hasSearched && term.trim().length > 0;
  const hasResults = bookResults.length > 0 || quoteResults.length > 0;

  return (
    <>
      <div
        className={`search-overlay-backdrop js-search-overlay-backdrop ${isOpen ? "is-open" : ""}`}
        onClick={closeOverlay}
      />
      <div
        className={`search-overlay js-search-overlay ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className="search-overlay-panel">
          <div className="search-overlay-input-row">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="search-overlay-input js-search-overlay-input"
              placeholder="Search quotes, books, authors..."
              autoComplete="off"
              value={term}
              onChange={(event) => runSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && term.trim()) goToSearch(term.trim());
              }}
            />
            <kbd className="search-overlay-esc">Esc</kbd>
          </div>

          <div className="search-overlay-results js-search-overlay-results">
            {showResults ? (
              hasResults ? (
                <>
                  {bookResults.length > 0 && (
                    <>
                      <div className="search-overlay-section-label">Books</div>
                      {bookResults.map((book) => (
                        <a
                          key={book.slug}
                          className="search-overlay-item js-search-result"
                          href={bookLink(book.slug)}
                          onClick={() => addRecentSearch(term)}
                        >
                          📖 {book.title}
                          {book.author && (
                            <span className="search-overlay-item-meta"> — {book.author}</span>
                          )}
                        </a>
                      ))}
                    </>
                  )}
                  {quoteResults.length > 0 && (
                    <>
                      <div className="search-overlay-section-label">Quotes</div>
                      {quoteResults.map((quote) => (
                        <a
                          key={quote.id}
                          className="search-overlay-item js-search-result"
                          href={bookLink(quote.book.slug)}
                          onClick={() => addRecentSearch(term)}
                        >
                          ❝ {quote.text.slice(0, 60)}
                          {quote.text.length > 60 ? "…" : ""}
                          <span className="search-overlay-item-meta"> — {quote.book.title}</span>
                        </a>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <div className="search-overlay-empty">No matches for &quot;{term}&quot;.</div>
              )
            ) : (
              <>
                {recents.length > 0 && (
                  <>
                    <div className="search-overlay-section-label">Recent Searches</div>
                    {recents.map((recentTerm) => (
                      <button
                        key={recentTerm}
                        type="button"
                        className="search-overlay-item js-search-recent"
                        onClick={() => handleRecentClick(recentTerm)}
                      >
                        🕘 {recentTerm}
                      </button>
                    ))}
                  </>
                )}
                <div className="search-overlay-section-label">Popular Books</div>
                {popularBooks.map((book) => (
                  <a key={book.slug} className="search-overlay-item" href={bookLink(book.slug)}>
                    📖 {book.title}
                    {book.author && <span className="search-overlay-item-meta"> — {book.author}</span>}
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
