"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { BookOpen, X, ArrowUpRight } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import { bookLink } from "@/lib/bookLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import { toggleBookBookmark } from "@/lib/bookBookmarks";
import type { SavedBook } from "@/lib/savedBooks";

export default function MyBooksGrid({
  books,
  supabase,
  ownerId,
  search,
  onChanged,
}: {
  books: SavedBook[];
  supabase: SupabaseClient;
  ownerId: string;
  search: string;
  onChanged: () => void;
}) {
  const filtered = search.trim()
    ? books.filter(
        (book) =>
          book.title.toLowerCase().includes(search.trim().toLowerCase()) ||
          (book.author ?? "").toLowerCase().includes(search.trim().toLowerCase()),
      )
    : books;

  async function handleRemove(slug: string) {
    toggleBookBookmark(slug);
    await supabase.from("saved_books").delete().eq("owner_id", ownerId).eq("book_slug", slug);
    onChanged();
  }

  if (books.length === 0) {
    return (
      <div className="ud-empty">
        <div className="ud-empty-icon">
          <BookOpen />
        </div>
        <div className="ud-empty-title">No books saved yet</div>
        <p>Save a whole book from its page — they&apos;ll show up here, synced to your account.</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="ud-empty">
        <div className="ud-empty-icon">
          <BookOpen />
        </div>
        <div className="ud-empty-title">No matches</div>
        <p>Nothing in My Books matches &quot;{search}&quot;.</p>
      </div>
    );
  }

  return (
    <div className="ud-book-grid">
      {filtered.map((book) => (
        <div key={book.slug} className="ud-book-card">
          <a className="ud-book-card-cover" href={bookLink(book.slug)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host */}
            <img src={resolveCoverUrl(book.image)} alt={`${book.title} cover`} loading="lazy" />
          </a>
          <div className="ud-book-card-body">
            <div className="ud-book-card-title">{book.title}</div>
            <div className="ud-book-card-author">{book.author ?? ""}</div>
            {book.category && <span className="ud-book-card-badge">{book.category}</span>}
          </div>
          <div className="ud-book-card-actions">
            <Tooltip label="Remove from My Books" position="below" align="end">
              <button
                type="button"
                className="ud-quote-card-action"
                aria-label="Remove from My Books"
                onClick={() => handleRemove(book.slug)}
              >
                <X />
              </button>
            </Tooltip>
            <Tooltip label="Read this book" position="below" align="end">
              <a className="ud-quote-card-action" aria-label="Read this book" href={bookLink(book.slug)}>
                <ArrowUpRight />
              </a>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}
