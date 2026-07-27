"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import { isBookBookmarked, toggleBookBookmark } from "@/lib/bookBookmarks";
import { syncSavedQuote } from "@/lib/savedQuotes";
import { syncSavedBook } from "@/lib/savedBooks";
import { recordBookView } from "@/lib/recentlyViewed";
import { speakOne, speakSequence, stopSpeaking } from "@/lib/textToSpeech";
import { useSpeechSupported } from "@/hooks/useSpeechSupported";
import { useAuthUser } from "@/hooks/useAuthUser";
import { createClient } from "@/lib/supabase/client";
import { AMAZON_AFFILIATE_TAG } from "@/lib/config";
import { resolveCoverUrl } from "@/lib/coverUrl";
import Tooltip from "./Tooltip";

type Quote = { id: number; text: string; position: number; editors_pick: boolean };
type Book = {
  slug: string;
  title: string;
  author: string | null;
  category: string | null;
  description: string | null;
  image: string;
};

function buildAmazonSearchUrl(title: string, author: string | null) {
  const query = author ? `${title} ${author}` : title;
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_AFFILIATE_TAG}`;
}

export default function BookQuotesSection({ book, quotes }: { book: Book; quotes: Quote[] }) {
  // Bookmarks live in localStorage, which doesn't exist during server
  // rendering — starting from "nothing bookmarked" here (matching the
  // server) and syncing the real value after mount avoids a hydration
  // mismatch for any visitor who actually has bookmarks (the whole point
  // of the feature), rather than only working by accident when there's
  // nothing bookmarked yet.
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [bookSaved, setBookSaved] = useState(false);
  const [popularQuoteVisible, setPopularQuoteVisible] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [playingAll, setPlayingAll] = useState(false);
  const speechSupported = useSpeechSupported();
  const { user } = useAuthUser();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only storage once after mount, per the note above.
    setBookmarkedIds(new Set(quotes.filter((q) => isBookmarked(q.id)).map((q) => q.id)));
    setBookSaved(isBookBookmarked(book.slug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fires once the auth check resolves to a real user -- a no-op for
    // anonymous visitors, and harmless to fire again on a revisit since it
    // just bumps viewed_at for this book rather than growing a new row.
    if (user) recordBookView(createClient(), user.id, book.slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const totalWords = quotes.reduce((sum, quote) => sum + quote.text.trim().split(/\s+/).length, 0);
  const readingMinutes = Math.max(1, Math.round(totalWords / 200));
  const sampleQuote =
    quotes.find((quote) => quote.editors_pick) ?? quotes.find((quote) => quote.position === 1) ?? quotes[0];

  function resetPlayingUI() {
    setPlayingIndex(null);
    setPlayingAll(false);
  }

  function handleToggleBookmark(id: number) {
    const nowBookmarked = toggleBookmark(id);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (user) syncSavedQuote(createClient(), user.id, id, nowBookmarked);
  }

  function handleToggleBookSave() {
    const nowSaved = toggleBookBookmark(book.slug);
    setBookSaved(nowSaved);
    if (user) syncSavedBook(createClient(), user.id, book.slug, nowSaved);
  }

  function handleListenOne(index: number) {
    const wasPlaying = playingIndex === index && !playingAll;
    resetPlayingUI();
    stopSpeaking();
    if (wasPlaying) return;

    setPlayingIndex(index);
    speakOne(quotes[index].text, { onEnd: resetPlayingUI });
  }

  function handleListenAll() {
    const wasPlaying = playingAll;
    resetPlayingUI();
    stopSpeaking();
    if (wasPlaying) return;

    setPlayingAll(true);
    speakSequence(
      quotes.map((q) => q.text),
      {
        onItemStart: (index) => setPlayingIndex(index),
        onItemEnd: () => setPlayingIndex(null),
        onDone: resetPlayingUI,
      },
    );
  }

  return (
    <>
      {quotes.length > 0 && sampleQuote && (
        <div className="book-hero">
          <Image
            className="book-hero-cover"
            src={resolveCoverUrl(book.image)}
            alt={`${book.title} cover`}
            width={400}
            height={600}
            sizes="(max-width: 640px) 100vw, 400px"
            priority
          />
          <div>
            <h2 className="book-hero-title">{book.title}</h2>
            {book.author && <div className="book-hero-author">{book.author}</div>}
            {book.description && <p className="book-hero-description">{book.description}</p>}
            <div className="book-hero-stats">
              <span className="book-stat">
                {quotes.length} Quote{quotes.length === 1 ? "" : "s"}
              </span>
              <span className="book-stat">{readingMinutes} min read</span>
              {book.category && <span className="book-stat">{book.category}</span>}
            </div>
            <div className="book-hero-actions">
              <button
                type="button"
                className="book-hero-btn"
                onClick={() => document.querySelector(".js-quotes")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                Read Quotes
              </button>
              <button
                type="button"
                className="book-hero-btn-secondary"
                onClick={() => setPopularQuoteVisible((v) => !v)}
              >
                {popularQuoteVisible ? "Hide Quote" : "Show Popular Quote"}
              </button>
              {speechSupported && (
                <button
                  type="button"
                  className={`book-hero-btn-secondary ${playingAll ? "is-playing" : ""}`}
                  onClick={handleListenAll}
                >
                  {playingAll ? "⏸ Stop Listening" : "🔊 Listen to All Quotes"}
                </button>
              )}
              <button
                type="button"
                className={`book-hero-btn-secondary ${bookSaved ? "is-saved" : ""}`}
                onClick={handleToggleBookSave}
              >
                {bookSaved ? "✓ Saved" : "🔖 Save Book"}
              </button>
              <a
                className="book-hero-btn-secondary"
                href={buildAmazonSearchUrl(book.title, book.author)}
                target="_blank"
                rel="noopener sponsored"
              >
                Buy on Amazon ↗
              </a>
            </div>
            {popularQuoteVisible && (
              <div className="book-hero-quote-reveal">&quot;{sampleQuote.text}&quot;</div>
            )}
          </div>
        </div>
      )}

      <div className="js-quotes">
        {quotes.map((quote, index) => {
          const bookmarkedNow = bookmarkedIds.has(quote.id);
          const isPlaying = playingIndex === index;

          return (
            <div key={quote.id} className={`quotes ${isPlaying ? "is-playing" : ""}`}>
              <div className="quote-number">{index + 1}</div>
              <p className="quote-text">{quote.text}</p>
              <div className="quote-actions">
                <Tooltip label={bookmarkedNow ? "Remove bookmark" : "Bookmark this quote"} align="end">
                  <button
                    type="button"
                    className={`quote-listen-btn ${bookmarkedNow ? "is-bookmarked" : ""}`}
                    aria-label="Bookmark this quote"
                    onClick={() => handleToggleBookmark(quote.id)}
                  >
                    {bookmarkedNow ? "★" : "☆"}
                  </button>
                </Tooltip>
                {speechSupported && (
                  <Tooltip label={isPlaying ? "Stop listening" : "Listen to this quote"} align="end">
                    <button
                      type="button"
                      className={`quote-listen-btn ${isPlaying ? "is-playing" : ""}`}
                      aria-label="Listen to this quote"
                      onClick={() => handleListenOne(index)}
                    >
                      {isPlaying ? "⏸" : "🔊"}
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
