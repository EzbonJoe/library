"use client";

import { useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { X } from "lucide-react";
import Tooltip from "@/components/Tooltip";

const MAX_LENGTH = 600;

export default function AddQuoteModal({
  isOpen,
  onClose,
  supabase,
  ownerId,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  supabase: SupabaseClient;
  ownerId: string;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    setError("");
    const { error: insertError } = await supabase.from("user_quotes").insert({
      owner_id: ownerId,
      text: text.trim(),
      book_title: bookTitle.trim() || null,
      status: "approved",
    });
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setText("");
    setBookTitle("");
    onSaved();
    onClose();
  }

  return (
    <>
      <div className={`ud-modal-backdrop ${isOpen ? "is-open" : ""}`} onClick={onClose} />
      <div className={`ud-modal ${isOpen ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Add a quote">
        <div className="ud-modal-header">
          <div className="ud-modal-title">Add a Quote</div>
          <Tooltip label="Close">
            <button type="button" className="ud-icon-btn" onClick={onClose} aria-label="Close">
              <X />
            </button>
          </Tooltip>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="ud-modal-body">
            <div>
              <div className="ud-field">
                <label className="ud-field-label" htmlFor="add-quote-text">
                  Quote
                </label>
                <textarea
                  id="add-quote-text"
                  rows={7}
                  value={text}
                  onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
                  placeholder="The line that stuck with you..."
                  required
                  autoFocus
                />
                <span className="ud-char-count">
                  {text.length} / {MAX_LENGTH}
                </span>
              </div>
              <div className="ud-field">
                <label className="ud-field-label" htmlFor="add-quote-book">
                  Book title (optional)
                </label>
                <input
                  id="add-quote-book"
                  type="text"
                  value={bookTitle}
                  onChange={(event) => setBookTitle(event.target.value)}
                  placeholder="e.g. Atomic Habits"
                />
              </div>
              {error && <p style={{ color: "var(--ud-danger)", fontSize: "1.2rem" }}>{error}</p>}
            </div>

            <div>
              <div className="ud-preview-label">Preview</div>
              <div className="ud-preview-card">
                <p className="ud-quote-card-text">{text.trim() ? `“${text}”` : "Your quote will appear here..."}</p>
                {bookTitle.trim() && <p className="ud-quote-card-meta">{bookTitle}</p>}
              </div>
            </div>
          </div>

          <div className="ud-modal-footer">
            <button type="button" className="ud-btn ud-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ud-btn ud-btn-primary" disabled={submitting || !text.trim()}>
              {submitting ? "Saving..." : "Save Quote"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
