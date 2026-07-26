"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Book = { id: number; title: string };

export default function AddQuotesPanel({ supabase, refreshKey }: { supabase: SupabaseClient; refreshKey: number }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    supabase
      .from("books")
      .select("id, title")
      .order("title")
      .then(({ data }) => {
        setBooks(data ?? []);
        if (data && data.length > 0) setBookId((prev) => prev || String(data[0].id));
      });
  }, [supabase, refreshKey]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Checking for duplicates...");

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!bookId || lines.length === 0) return;

    const { data: existing } = await supabase.from("quotes").select("text").eq("book_id", bookId);
    const existingSet = new Set((existing ?? []).map((q) => q.text.trim().toLowerCase()));
    const seenInBatch = new Set<string>();
    const uniqueLines: string[] = [];
    let duplicateCount = 0;

    for (const line of lines) {
      const normalized = line.toLowerCase();
      if (existingSet.has(normalized) || seenInBatch.has(normalized)) {
        duplicateCount++;
        continue;
      }
      seenInBatch.add(normalized);
      uniqueLines.push(line);
    }

    if (uniqueLines.length === 0) {
      setStatus(`All ${lines.length} quote(s) already exist for this book — nothing added.`);
      return;
    }

    const { data: lastQuote } = await supabase
      .from("quotes")
      .select("position")
      .eq("book_id", bookId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextPosition = (lastQuote?.position ?? 0) + 1;
    // A multi-row insert evaluates the DB's now() default once for the
    // whole statement, so every line in a paste would otherwise land on
    // the exact same created_at — which is what made the home feed clump
    // by book (it sorts by recency). Staggering them a second apart here
    // keeps a bulk paste from reading as one indistinguishable timestamp.
    const baseTime = Date.now();
    const rows = uniqueLines.map((line, index) => ({
      book_id: Number(bookId),
      text: line,
      position: nextPosition++,
      created_at: new Date(baseTime + index * 1000).toISOString(),
    }));

    const { error } = await supabase.from("quotes").insert(rows);

    if (error) {
      setStatus(error.message);
      return;
    }

    setText("");
    setStatus(
      duplicateCount > 0
        ? `Added ${uniqueLines.length} quote(s), skipped ${duplicateCount} duplicate(s).`
        : uniqueLines.length === 1
          ? "Quote added."
          : `${uniqueLines.length} quotes added.`,
    );
  }

  return (
    <div className="admin-card js-admin-panel" data-tab="add-quotes">
      <h2>Add quotes</h2>
      <p className="admin-hint">
        Paste one quote per line to add several at once — each line becomes its own quote. Duplicates already saved
        for this book are automatically skipped.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Book
          <select value={bookId} onChange={(event) => setBookId(event.target.value)} required>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Quote(s)
          <textarea
            rows={8}
            placeholder="One quote per line..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
          />
        </label>
        <button type="submit">Add quote(s)</button>
      </form>
      <p className="status-text">{status}</p>
    </div>
  );
}
