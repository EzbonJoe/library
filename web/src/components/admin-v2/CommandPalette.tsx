"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Search, BookOpen, Quote } from "lucide-react";
import type { NavKey } from "./nav";

export const TOGGLE_ADMIN_SEARCH_EVENT = "gadzeke-admin:toggle-search";

type BookResult = { id: number; title: string; author: string | null };
type QuoteResult = { id: number; text: string; books: { title: string } | null };

export default function CommandPalette({
  supabase,
  onNavigate,
}: {
  supabase: SupabaseClient;
  onNavigate: (tab: NavKey) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [books, setBooks] = useState<BookResult[]>([]);
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function toggle() {
      setIsOpen((open) => !open);
    }
    function handleKeydown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        toggle();
      }
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener(TOGGLE_ADMIN_SEARCH_EVENT, toggle);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      window.removeEventListener(TOGGLE_ADMIN_SEARCH_EVENT, toggle);
    };
  }, []);

  // "Adjusting state when a prop changes" during render instead of an
  // effect — resets happen in the same commit the palette opens.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTerm("");
      setBooks([]);
      setQuotes([]);
    }
  }

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  function runSearch(value: string) {
    setTerm(value);
    clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setBooks([]);
      setQuotes([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const [{ data: bookData }, { data: quoteData }] = await Promise.all([
        supabase.from("books").select("id, title, author").ilike("title", `%${value}%`).limit(5),
        supabase.from("quotes").select("id, text, books(title)").ilike("text", `%${value}%`).limit(5),
      ]);
      setBooks(bookData ?? []);
      setQuotes((quoteData ?? []) as unknown as QuoteResult[]);
    }, 250);
  }

  function goTo(tab: NavKey) {
    setIsOpen(false);
    onNavigate(tab);
  }

  const hasResults = books.length > 0 || quotes.length > 0;

  return (
    <>
      <div className={`av-palette-backdrop ${isOpen ? "is-open" : ""}`} onClick={() => setIsOpen(false)} />
      <div className={`av-palette ${isOpen ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Search">
        <div className="av-palette-input-row">
          <Search />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search books, quotes..."
            value={term}
            onChange={(event) => runSearch(event.target.value)}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="av-palette-results">
          {term.trim() && !hasResults && <div className="av-palette-empty">No matches for &quot;{term}&quot;.</div>}
          {books.length > 0 && (
            <>
              <div className="av-palette-section-label">Books</div>
              {books.map((book) => (
                <button key={book.id} type="button" className="av-palette-item" onClick={() => goTo("books")}>
                  <BookOpen size={16} />
                  {book.title}
                  {book.author && <span className="av-palette-item-meta">— {book.author}</span>}
                </button>
              ))}
            </>
          )}
          {quotes.length > 0 && (
            <>
              <div className="av-palette-section-label">Quotes</div>
              {quotes.map((quote) => (
                <button key={quote.id} type="button" className="av-palette-item" onClick={() => goTo("quotes")}>
                  <Quote size={16} />
                  {quote.text.slice(0, 60)}
                  {quote.text.length > 60 ? "…" : ""}
                  {quote.books?.title && <span className="av-palette-item-meta">— {quote.books.title}</span>}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
