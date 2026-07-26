"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Star } from "lucide-react";
import { resolveCoverUrl } from "@/lib/coverUrl";
import Tooltip from "@/components/Tooltip";
import EmptyState from "./EmptyState";

type FeaturedBook = { id: number; title: string; author: string | null; image: string };

export default function FeaturedPage({ supabase }: { supabase: SupabaseClient }) {
  const [books, setBooks] = useState<FeaturedBook[] | null>(null);

  function load() {
    supabase
      .from("books")
      .select("id, title, author, image")
      .eq("featured", true)
      .order("title")
      .then(({ data }) => setBooks(data ?? []));
  }

  useEffect(load, [supabase]);

  async function handleUnfeature(id: number) {
    await supabase.from("books").update({ featured: false }).eq("id", id);
    load();
  }

  if (books === null) {
    return (
      <div className="av-book-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="av-skeleton av-skeleton-book" />
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return <EmptyState icon={Star} title="No featured books yet. Feature one from the Books page." />;
  }

  return (
    <div className="av-book-grid">
      {books.map((book) => (
        <div key={book.id} className="av-book-card">
          <div className="av-book-cover-frame">
            {/* eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host */}
            <img src={resolveCoverUrl(book.image)} alt={`${book.title} cover`} loading="lazy" />
            <div className="av-book-card-actions">
              <Tooltip label="Remove from featured">
                <button
                  type="button"
                  className="av-book-card-action is-featured"
                  aria-label="Remove from featured"
                  onClick={() => handleUnfeature(book.id)}
                >
                  <Star fill="currentColor" />
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="av-book-card-body">
            <div className="av-book-card-title">{book.title}</div>
            <div className="av-book-card-author">{book.author ?? "Unknown author"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
