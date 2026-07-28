"use client";

import { useEffect, useState } from "react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import { syncSavedQuote } from "@/lib/savedQuotes";
import { speakOne, stopSpeaking } from "@/lib/textToSpeech";
import { useSpeechSupported } from "@/hooks/useSpeechSupported";
import { useAuthUser } from "@/hooks/useAuthUser";
import { createClient } from "@/lib/supabase/client";
import Tooltip from "./Tooltip";

export default function QuotePageClient({ quoteId, quoteText }: { quoteId: number; quoteText: string }) {
  // localStorage doesn't exist during server rendering -- start at "not
  // bookmarked" (matching the server) and sync the real value after mount,
  // same pattern as every other bookmark control in the app.
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const speechSupported = useSpeechSupported();
  const { user } = useAuthUser();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarked(isBookmarked(quoteId));
  }, [quoteId]);

  function handleBookmark() {
    const next = toggleBookmark(quoteId);
    setBookmarked(next);
    if (user) syncSavedQuote(createClient(), user.id, quoteId, next);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(quoteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ text: quoteText, url }).catch(() => {});
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
    speakOne(quoteText, { onEnd: () => setPlaying(false) });
  }

  return (
    <div className="quote-page-actions">
      <Tooltip label={bookmarked ? "Remove bookmark" : "Bookmark this quote"}>
        <button
          type="button"
          className={`quote-listen-btn ${bookmarked ? "is-bookmarked" : ""}`}
          aria-label="Bookmark this quote"
          onClick={handleBookmark}
        >
          {bookmarked ? "★" : "☆"}
        </button>
      </Tooltip>
      <Tooltip label="Share this quote">
        <button type="button" className="quote-listen-btn" aria-label="Share this quote" onClick={handleShare}>
          ⤴
        </button>
      </Tooltip>
      <Tooltip label={copied ? "Copied!" : "Copy this quote"}>
        <button type="button" className="quote-listen-btn" aria-label="Copy this quote" onClick={handleCopy}>
          {copied ? "✓" : "⧉"}
        </button>
      </Tooltip>
      {speechSupported && (
        <Tooltip label={playing ? "Stop listening" : "Listen to this quote"}>
          <button
            type="button"
            className={`quote-listen-btn ${playing ? "is-playing" : ""}`}
            aria-label="Listen to this quote"
            onClick={handleListen}
          >
            {playing ? "⏸" : "🔊"}
          </button>
        </Tooltip>
      )}
    </div>
  );
}
