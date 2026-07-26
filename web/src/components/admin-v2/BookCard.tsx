"use client";

import { Pencil, Trash2, Star, Copy } from "lucide-react";
import { resolveCoverUrl } from "@/lib/coverUrl";
import Tooltip from "@/components/Tooltip";

export type BookRow = {
  id: number;
  title: string;
  author: string | null;
  category: string | null;
  status: string;
  image: string;
  slug: string;
  description: string | null;
  featured: boolean;
  quoteCount: number;
};

export default function BookCard({
  book,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleFeature,
  onDuplicate,
}: {
  book: BookRow;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeature: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="av-book-card">
      <input
        type="checkbox"
        className="av-book-card-select"
        checked={selected}
        onChange={onToggleSelect}
        aria-label={`Select ${book.title}`}
      />
      <div className="av-book-cover-frame">
        {/* eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host */}
        <img src={resolveCoverUrl(book.image)} alt={`${book.title} cover`} loading="lazy" />
        <span className="av-book-status-badge">{book.status === "published" ? "Published" : "Coming Soon"}</span>
        <div className="av-book-card-actions">
          <Tooltip label="Edit">
            <button type="button" className="av-book-card-action" aria-label="Edit" onClick={onEdit}>
              <Pencil />
            </button>
          </Tooltip>
          <Tooltip label={book.featured ? "Remove from featured" : "Feature this book"}>
            <button
              type="button"
              className={`av-book-card-action ${book.featured ? "is-featured" : ""}`}
              aria-label="Feature"
              onClick={onToggleFeature}
            >
              <Star fill={book.featured ? "currentColor" : "none"} />
            </button>
          </Tooltip>
          <Tooltip label="Duplicate">
            <button type="button" className="av-book-card-action" aria-label="Duplicate" onClick={onDuplicate}>
              <Copy />
            </button>
          </Tooltip>
          <Tooltip label="Delete">
            <button type="button" className="av-book-card-action is-danger" aria-label="Delete" onClick={onDelete}>
              <Trash2 />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="av-book-card-body">
        <div className="av-book-card-title">{book.title}</div>
        <div className="av-book-card-author">{book.author ?? "Unknown author"}</div>
        <div className="av-book-card-meta">
          {book.category && <span className="av-badge">{book.category}</span>}
          <span className="av-badge av-badge-accent">
            {book.quoteCount} quote{book.quoteCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
