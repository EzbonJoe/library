"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveCoverUrl } from "@/lib/coverUrl";

type Book = { id: number; title: string; author: string | null; image: string };

export default function AddQuotesPanel({ supabase, refreshKey }: { supabase: SupabaseClient; refreshKey: number }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    supabase
      .from("books")
      .select("id, title, author, image")
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

  const selectedBook = books.find((book) => String(book.id) === bookId);

  return (
    <div className="av-card" style={{ padding: 24 }}>
      <h2 style={{ fontFamily: "var(--av-font-display)", fontSize: "1.6rem", fontWeight: 600, marginBottom: 4 }}>
        Add quotes
      </h2>
      <p className="av-activity-meta" style={{ marginBottom: 20 }}>
        Paste one quote per line to add several at once — each line becomes its own quote. Duplicates already saved
        for this book are automatically skipped.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div className="av-field">
          <label className="av-field-label">Book</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {selectedBook?.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host
              <img
                src={resolveCoverUrl(selectedBook.image)}
                alt=""
                style={{ width: 40, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 56,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: "var(--av-bg)",
                  border: "1px solid var(--av-border)",
                }}
              />
            )}
            <select value={bookId} onChange={(event) => setBookId(event.target.value)} required style={{ flex: 1 }}>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="av-field">
          <label className="av-field-label">Quote(s)</label>
          <textarea
            rows={8}
            placeholder="One quote per line..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            required
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>
        <button type="submit" className="av-btn av-btn-primary" style={{ alignSelf: "flex-start" }}>
          Add quote(s)
        </button>
      </form>
      {status && (
        <p className="av-activity-meta" style={{ marginTop: 12 }}>
          {status}
        </p>
      )}
    </div>
  );
}
