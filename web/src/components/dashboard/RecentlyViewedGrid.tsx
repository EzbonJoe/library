"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Clock, X, ArrowUpRight } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import { bookLink } from "@/lib/bookLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import { removeRecentlyViewed, clearRecentlyViewed, type RecentlyViewedBook } from "@/lib/recentlyViewed";

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RecentlyViewedGrid({
  books,
  supabase,
  ownerId,
  search,
  onChanged,
}: {
  books: RecentlyViewedBook[];
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
    await removeRecentlyViewed(supabase, ownerId, slug);
    onChanged();
  }

  async function handleClearAll() {
    if (!confirm("Clear your entire viewing history? This can't be undone.")) return;
    await clearRecentlyViewed(supabase, ownerId);
    onChanged();
  }

  if (books.length === 0) {
    return (
      <div className="ud-empty">
        <div className="ud-empty-icon">
          <Clock />
        </div>
        <div className="ud-empty-title">Nothing viewed yet</div>
        <p>Books you open will show up here, most recent first.</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="ud-empty">
        <div className="ud-empty-icon">
          <Clock />
        </div>
        <div className="ud-empty-title">No matches</div>
        <p>Nothing in Recently Viewed matches &quot;{search}&quot;.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button type="button" className="ud-btn ud-btn-secondary ud-btn-sm" onClick={handleClearAll}>
          Clear all
        </button>
      </div>
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
              <div className="ud-book-card-viewed">{formatRelativeTime(book.viewed_at)}</div>
            </div>
            <div className="ud-book-card-actions">
              <Tooltip label="Remove from history" position="below" align="end">
                <button
                  type="button"
                  className="ud-quote-card-action"
                  aria-label="Remove from history"
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
    </div>
  );
}
