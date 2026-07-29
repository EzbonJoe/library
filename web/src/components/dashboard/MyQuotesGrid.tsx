"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Pencil, Trash2, Copy, Check, PenLine, Quote, Volume2, Pause } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import AddToCollectionButton from "./AddToCollectionButton";
import { speakOne, stopSpeaking } from "@/lib/textToSpeech";
import { useSpeechSupported } from "@/hooks/useSpeechSupported";

export type MyQuote = { id: number; text: string; book_title: string | null; created_at: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function MyQuotesGrid({
  quotes,
  supabase,
  ownerId,
  search,
  onChanged,
}: {
  quotes: MyQuote[];
  supabase: SupabaseClient;
  ownerId: string;
  search: string;
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editBookTitle, setEditBookTitle] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const speechSupported = useSpeechSupported();

  const filtered = search.trim()
    ? quotes.filter(
        (q) =>
          q.text.toLowerCase().includes(search.trim().toLowerCase()) ||
          (q.book_title ?? "").toLowerCase().includes(search.trim().toLowerCase()),
      )
    : quotes;

  function startEdit(quote: MyQuote) {
    setEditingId(quote.id);
    setEditText(quote.text);
    setEditBookTitle(quote.book_title ?? "");
  }

  async function saveEdit(id: number) {
    const { error } = await supabase
      .from("user_quotes")
      .update({ text: editText.trim(), book_title: editBookTitle.trim() || null })
      .eq("id", id);
    if (!error) {
      setEditingId(null);
      onChanged();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this quote? This can't be undone.")) return;
    await supabase.from("user_quotes").delete().eq("id", id);
    onChanged();
  }

  async function handleDuplicate(quote: MyQuote) {
    await supabase.from("user_quotes").insert({
      owner_id: ownerId,
      text: quote.text,
      book_title: quote.book_title,
      status: "approved",
    });
    onChanged();
  }

  async function handleCopy(quote: MyQuote) {
    await navigator.clipboard.writeText(quote.book_title ? `"${quote.text}" — ${quote.book_title}` : `"${quote.text}"`);
    setCopiedId(quote.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleListen(quote: MyQuote) {
    const wasPlaying = playingId === quote.id;
    stopSpeaking();
    setPlayingId(null);
    if (wasPlaying) return;

    setPlayingId(quote.id);
    speakOne(quote.text, { onEnd: () => setPlayingId(null) });
  }

  if (quotes.length === 0) {
    return (
      <div className="ud-empty">
        <div className="ud-empty-icon">
          <PenLine />
        </div>
        <div className="ud-empty-title">Nothing saved yet</div>
        <p>Add the first line that&apos;s stuck with you using the + button.</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="ud-empty">
        <div className="ud-empty-icon">
          <PenLine />
        </div>
        <div className="ud-empty-title">No matches</div>
        <p>Nothing in My Quotes matches &quot;{search}&quot;.</p>
      </div>
    );
  }

  return (
    <div className="ud-quote-grid">
      {filtered.map((quote) => (
        <div key={quote.id} className="ud-quote-card">
          {editingId === quote.id ? (
            <div className="ud-field" style={{ marginBottom: 0 }}>
              <textarea rows={4} value={editText} onChange={(event) => setEditText(event.target.value)} />
              <input
                type="text"
                value={editBookTitle}
                onChange={(event) => setEditBookTitle(event.target.value)}
                placeholder="Book title (optional)"
                style={{ marginTop: 8 }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button type="button" className="ud-btn ud-btn-primary ud-btn-sm" onClick={() => saveEdit(quote.id)}>
                  Save
                </button>
                <button
                  type="button"
                  className="ud-btn ud-btn-secondary ud-btn-sm"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="ud-quote-card-text">&ldquo;{quote.text}&rdquo;</p>
              <div className="ud-quote-card-meta">
                <span>{quote.book_title || "Personal"}</span>
                <span>{formatDate(quote.created_at)}</span>
              </div>
              <div className="ud-quote-card-actions">
                <Tooltip label="Edit">
                  <button
                    type="button"
                    className="ud-quote-card-action"
                    aria-label="Edit"
                    onClick={() => startEdit(quote)}
                  >
                    <Pencil />
                  </button>
                </Tooltip>
                <AddToCollectionButton supabase={supabase} ownerId={ownerId} itemType="personal" itemRef={quote.id} />
                <Tooltip label="Duplicate">
                  <button
                    type="button"
                    className="ud-quote-card-action"
                    aria-label="Duplicate"
                    onClick={() => handleDuplicate(quote)}
                  >
                    <Copy />
                  </button>
                </Tooltip>
                <Tooltip label={copiedId === quote.id ? "Copied!" : "Copy quote text"}>
                  <button
                    type="button"
                    className="ud-quote-card-action"
                    aria-label={copiedId === quote.id ? "Copied" : "Copy quote text"}
                    onClick={() => handleCopy(quote)}
                  >
                    {copiedId === quote.id ? <Check /> : <Quote />}
                  </button>
                </Tooltip>
                <Tooltip label="Delete">
                  <button
                    type="button"
                    className="ud-quote-card-action is-danger"
                    aria-label="Delete"
                    onClick={() => handleDelete(quote.id)}
                  >
                    <Trash2 />
                  </button>
                </Tooltip>
                {speechSupported && (
                  <Tooltip label={playingId === quote.id ? "Stop listening" : "Listen to this quote"}>
                    <button
                      type="button"
                      className={`ud-quote-card-action ${playingId === quote.id ? "is-saved" : ""}`}
                      aria-label={playingId === quote.id ? "Stop listening" : "Listen to this quote"}
                      onClick={() => handleListen(quote)}
                    >
                      {playingId === quote.id ? <Pause /> : <Volume2 />}
                    </button>
                  </Tooltip>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
