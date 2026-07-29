"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Heart, Copy, Check, ArrowUpRight, Volume2, Pause } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import AddToCollectionButton from "./AddToCollectionButton";
import { bookLink } from "@/lib/bookLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import { toggleBookmark } from "@/lib/bookmarks";
import { speakOne, stopSpeaking } from "@/lib/textToSpeech";
import { useSpeechSupported } from "@/hooks/useSpeechSupported";
import type { SavedQuote } from "@/lib/savedQuotes";

export default function SavedQuotesGrid({
  quotes,
  supabase,
  ownerId,
  search,
  onChanged,
}: {
  quotes: SavedQuote[];
  supabase: SupabaseClient;
  ownerId: string;
  search: string;
  onChanged: () => void;
}) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const speechSupported = useSpeechSupported();

  const filtered = search.trim()
    ? quotes.filter(
        (q) =>
          q.text.toLowerCase().includes(search.trim().toLowerCase()) ||
          q.book.title.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : quotes;

  async function handleUnsave(quoteId: number) {
    toggleBookmark(quoteId);
    await supabase.from("saved_quotes").delete().eq("owner_id", ownerId).eq("quote_id", quoteId);
    onChanged();
  }

  async function handleCopy(quote: SavedQuote) {
    await navigator.clipboard.writeText(`"${quote.text}" — ${quote.book.title}`);
    setCopiedId(quote.quote_id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleListen(quote: SavedQuote) {
    const wasPlaying = playingId === quote.quote_id;
    stopSpeaking();
    setPlayingId(null);
    if (wasPlaying) return;

    setPlayingId(quote.quote_id);
    speakOne(quote.text, { onEnd: () => setPlayingId(null) });
  }

  if (quotes.length === 0) {
    return (
      <div className="ud-empty">
        <div className="ud-empty-icon">
          <Heart />
        </div>
        <div className="ud-empty-title">Nothing saved yet</div>
        <p>Bookmark quotes from the home feed or a book page — they&apos;ll show up here, synced to your account.</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="ud-empty">
        <div className="ud-empty-icon">
          <Heart />
        </div>
        <div className="ud-empty-title">No matches</div>
        <p>Nothing in Saved Quotes matches &quot;{search}&quot;.</p>
      </div>
    );
  }

  return (
    <div className="ud-quote-grid">
      {filtered.map((quote) => (
        <div key={quote.quote_id} className="ud-quote-card">
          <a className="ud-quote-card-book" href={bookLink(quote.book.slug)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host */}
            <img src={resolveCoverUrl(quote.book.image)} alt="" loading="lazy" />
            <div>
              <div className="ud-quote-card-book-title">{quote.book.title}</div>
              <div className="ud-quote-card-book-author">{quote.book.author ?? ""}</div>
            </div>
          </a>

          <p className="ud-quote-card-text">&ldquo;{quote.text}&rdquo;</p>

          <div className="ud-quote-card-actions">
            <Tooltip label="Remove from Saved Quotes">
              <button
                type="button"
                className="ud-quote-card-action is-saved"
                aria-label="Remove from Saved Quotes"
                onClick={() => handleUnsave(quote.quote_id)}
              >
                <Heart fill="currentColor" />
              </button>
            </Tooltip>
            <AddToCollectionButton supabase={supabase} ownerId={ownerId} itemType="saved" itemRef={quote.quote_id} />
            <Tooltip label={copiedId === quote.quote_id ? "Copied!" : "Copy quote text"}>
              <button
                type="button"
                className="ud-quote-card-action"
                aria-label={copiedId === quote.quote_id ? "Copied" : "Copy quote text"}
                onClick={() => handleCopy(quote)}
              >
                {copiedId === quote.quote_id ? <Check /> : <Copy />}
              </button>
            </Tooltip>
            <Tooltip label="Read in book">
              <a className="ud-quote-card-action" aria-label="Read in book" href={bookLink(quote.book.slug)}>
                <ArrowUpRight />
              </a>
            </Tooltip>
            {speechSupported && (
              <Tooltip label={playingId === quote.quote_id ? "Stop listening" : "Listen to this quote"}>
                <button
                  type="button"
                  className={`ud-quote-card-action ${playingId === quote.quote_id ? "is-saved" : ""}`}
                  aria-label={playingId === quote.quote_id ? "Stop listening" : "Listen to this quote"}
                  onClick={() => handleListen(quote)}
                >
                  {playingId === quote.quote_id ? <Pause /> : <Volume2 />}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
