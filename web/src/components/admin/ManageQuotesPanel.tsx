"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCoverUrl } from "@/lib/coverUrl";

type Book = { id: number; title: string };
type Quote = {
  id: number;
  text: string;
  featured: boolean;
  editors_pick: boolean;
  books: { title: string; image: string };
};

function QuoteRow({
  quote,
  supabase,
  onChanged,
}: {
  quote: Quote;
  supabase: SupabaseClient;
  onChanged: () => void;
}) {
  const [text, setText] = useState(quote.text);
  const [saveLabel, setSaveLabel] = useState("Save");

  async function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSaveLabel("Saving...");
    const { error } = await supabase.from("quotes").update({ text: trimmed }).eq("id", quote.id);
    setSaveLabel(error ? "Save" : "Saved ✓");
    if (error) {
      alert(error.message);
    } else {
      setTimeout(() => setSaveLabel("Save"), 1500);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this quote?")) return;
    await supabase.from("quotes").delete().eq("id", quote.id);
    onChanged();
  }

  async function handleFeature() {
    await supabase.from("quotes").update({ featured: false }).eq("featured", true);
    await supabase.from("quotes").update({ featured: true }).eq("id", quote.id);
    onChanged();
  }

  async function handleEditorsPick() {
    await supabase.from("quotes").update({ editors_pick: !quote.editors_pick }).eq("id", quote.id);
    onChanged();
  }

  return (
    <div className="recent-quote">
      <div className="recent-quote-book" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {quote.books.image && (
          // eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host
          <img
            src={resolveCoverUrl(quote.books.image)}
            alt=""
            style={{ width: 28, height: 38, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
          />
        )}
        {quote.books.title}
      </div>
      <textarea
        className="recent-quote-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="recent-quote-actions">
        <button type="button" onClick={handleSave}>
          {saveLabel}
        </button>
        <button type="button" className={quote.featured ? "is-featured" : ""} onClick={handleFeature}>
          {quote.featured ? "★ Featured" : "☆ Set as Featured"}
        </button>
        <button type="button" className={quote.editors_pick ? "is-picked" : ""} onClick={handleEditorsPick}>
          {quote.editors_pick ? "✨ Editor's Pick" : "☆ Mark as Pick"}
        </button>
        <button type="button" className="js-delete-quote" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default function ManageQuotesPanel({ supabase, refreshKey }: { supabase: SupabaseClient; refreshKey: number }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookFilter, setBookFilter] = useState("");
  const [search, setSearch] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    supabase
      .from("books")
      .select("id, title")
      .order("title")
      .then(({ data }) => setBooks(data ?? []));
  }, [supabase, refreshKey]);

  useEffect(() => {
    let query = supabase.from("quotes").select("id, text, featured, editors_pick, books(title, image)");

    if (bookFilter) {
      query = query.eq("book_id", bookFilter).order("position");
    } else {
      query = query.order("created_at", { ascending: false }).limit(20);
    }

    if (search.trim()) {
      query = query.ilike("text", `%${search.trim()}%`);
    }

    query.then(({ data }) => setQuotes((data ?? []) as unknown as Quote[]));
  }, [supabase, bookFilter, search, refreshKey, reloadCount]);

  return (
    <div className="admin-card js-admin-panel" data-tab="manage-quotes">
      <h2>Manage quotes</h2>
      <p className="admin-hint">
        Pick a book to edit or delete any of its quotes, or leave it on &quot;All books&quot; to see the most recent
        additions. &quot;Featured&quot; controls the home page&apos;s main hero (one at a time); &quot;Editor&apos;s
        Pick&quot; can be applied to any number of quotes and feeds the daily-rotating hero plus badges shown in the
        feed.
      </p>
      <div className="quote-filter-bar">
        <select value={bookFilter} onChange={(event) => setBookFilter(event.target.value)}>
          <option value="">All books (recent 20)</option>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="admin-search"
          placeholder="Search quote text..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div>
        {quotes.map((quote) => (
          <QuoteRow key={quote.id} quote={quote} supabase={supabase} onChanged={() => setReloadCount((c) => c + 1)} />
        ))}
      </div>
    </div>
  );
}
