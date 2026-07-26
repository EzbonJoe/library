"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { bookLink } from "@/lib/bookLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import { syncSavedQuote } from "@/lib/savedQuotes";
import { speakOne, stopSpeaking } from "@/lib/textToSpeech";
import { useSpeechSupported } from "@/hooks/useSpeechSupported";
import { useAuthUser } from "@/hooks/useAuthUser";
import { createClient } from "@/lib/supabase/client";
import Tooltip from "./Tooltip";

export type FeedQuote = {
  id: number;
  text: string;
  editors_pick: boolean;
  book: { title: string; image: string; author: string | null; category: string | null; slug: string };
};

function estimateReadingTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  const seconds = Math.max(5, Math.round((words / 200) * 60));
  return seconds < 60 ? `${seconds} sec read` : `${Math.round(seconds / 60)} min read`;
}

// Fades a card in once it scrolls into view — same technique as the old
// feed.js (IntersectionObserver toggling an `is-visible` class), just as a
// small reusable hook instead of a one-off DOM query per card.
function useEntranceObserver<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

export default function QuoteCard({ quote, variant }: { quote: FeedQuote; variant: "default" | "large" | "spotlight" }) {
  const { book } = quote;
  // localStorage doesn't exist during server rendering — start at "not
  // bookmarked" (matching the server) and sync the real value after mount,
  // so this doesn't hydration-mismatch for any visitor who's actually
  // bookmarked this quote.
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { ref, isVisible } = useEntranceObserver<HTMLElement>();
  const speechSupported = useSpeechSupported();
  const { user } = useAuthUser();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarked(isBookmarked(quote.id));
  }, [quote.id]);

  function handleBookmark() {
    const next = toggleBookmark(quote.id);
    setBookmarked(next);
    if (user) syncSavedQuote(createClient(), user.id, quote.id, next);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(quote.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleShare() {
    const url = `${window.location.origin}${bookLink(book.slug)}`;
    if (navigator.share) {
      navigator.share({ text: quote.text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  function handleListen() {
    const wasPlaying = playing;
    stopSpeaking();
    setPlaying(false);
    if (wasPlaying) return;

    setPlaying(true);
    speakOne(quote.text, { onEnd: () => setPlaying(false) });
  }

  const actions = (
    <div className="quote-card-actions">
      <Tooltip label={bookmarked ? "Remove bookmark" : "Bookmark this quote"}>
        <button
          type="button"
          className={`icon-btn ${bookmarked ? "is-bookmarked" : ""}`}
          aria-label="Bookmark this quote"
          onClick={handleBookmark}
        >
          {bookmarked ? "★" : "☆"}
        </button>
      </Tooltip>
      <Tooltip label="Share this quote">
        <button type="button" className="icon-btn" aria-label="Share this quote" onClick={handleShare}>
          ⤴
        </button>
      </Tooltip>
      <Tooltip label={copied ? "Copied!" : "Copy this quote"}>
        <button
          type="button"
          className={`icon-btn ${copied ? "is-copied" : ""}`}
          aria-label="Copy this quote"
          onClick={handleCopy}
        >
          {copied ? "Copied ✓" : "⧉"}
        </button>
      </Tooltip>
      {speechSupported && (
        <Tooltip label={playing ? "Stop listening" : "Listen to this quote"}>
          <button
            type="button"
            className={`icon-btn ${playing ? "is-playing" : ""}`}
            aria-label="Listen to this quote"
            onClick={handleListen}
          >
            {playing ? "⏸" : "🔊"}
          </button>
        </Tooltip>
      )}
    </div>
  );

  if (variant === "spotlight") {
    return (
      <article
        ref={ref}
        className={`quote-card quote-card--spotlight ${isVisible ? "is-visible" : ""}`}
        style={{ backgroundImage: `url('${resolveCoverUrl(book.image)}')` }}
      >
        <div className="quote-card-spotlight-overlay" />
        <div className="quote-card-spotlight-content">
          {quote.editors_pick && <span className="quote-card-editors-badge">✨ Editor&apos;s Pick</span>}
          <p className="quote-card-text">{quote.text}</p>
          <div className="quote-card-spotlight-book">
            {book.title}
            {book.author ? ` — ${book.author}` : ""}
          </div>
          <div className="quote-card-footer">
            <span className="quote-card-meta">{estimateReadingTime(quote.text)}</span>
            {actions}
          </div>
          <a className="quote-card-link" href={bookLink(book.slug)}>
            Read more from this book →
          </a>
        </div>
      </article>
    );
  }

  return (
    <article
      ref={ref}
      className={`quote-card ${variant === "large" ? "quote-card--large" : ""} ${isVisible ? "is-visible" : ""}`}
    >
      {quote.editors_pick && <span className="quote-card-editors-badge">✨ Editor&apos;s Pick</span>}
      <div className="quote-card-top">
        <Image
          className="quote-card-cover"
          src={resolveCoverUrl(book.image)}
          alt={`${book.title} cover`}
          width={40}
          height={56}
          loading="lazy"
        />
        <div className="quote-card-book-meta">
          <div className="quote-card-title">{book.title}</div>
          <div className="quote-card-author">{book.author ?? ""}</div>
        </div>
        {book.category && <span className="quote-card-badge">{book.category}</span>}
      </div>

      <p className="quote-card-text">{quote.text}</p>

      <div className="quote-card-footer">
        <span className="quote-card-meta">{estimateReadingTime(quote.text)}</span>
        {actions}
      </div>

      <a className="quote-card-link" href={bookLink(book.slug)}>
        Read more from this book →
      </a>
    </article>
  );
}
