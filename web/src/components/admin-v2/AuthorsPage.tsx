"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PenLine } from "lucide-react";
import EmptyState from "./EmptyState";

type AuthorRow = { name: string; bookCount: number };

// Authors aren't a real table yet — this is derived read-only from
// books.author. A full Authors CMS page (bio, avatar, edit/delete) would
// need that normalized into its own table first.
export default function AuthorsPage({ supabase }: { supabase: SupabaseClient }) {
  const [authors, setAuthors] = useState<AuthorRow[] | null>(null);

  useEffect(() => {
    supabase
      .from("books")
      .select("author")
      .not("author", "is", null)
      .then(({ data }) => {
        const counts = new Map<string, number>();
        (data ?? []).forEach((row) => {
          if (!row.author) return;
          counts.set(row.author, (counts.get(row.author) ?? 0) + 1);
        });
        setAuthors(
          [...counts.entries()]
            .map(([name, bookCount]) => ({ name, bookCount }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      });
  }, [supabase]);

  if (authors === null) {
    return (
      <div className="av-book-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="av-skeleton" style={{ height: 80 }} />
        ))}
      </div>
    );
  }

  if (authors.length === 0) {
    return <EmptyState icon={PenLine} title="No authors yet." />;
  }

  return (
    <div className="av-table-wrap">
      <table className="av-table">
        <thead>
          <tr>
            <th>Author</th>
            <th>Books</th>
          </tr>
        </thead>
        <tbody>
          {authors.map((author) => (
            <tr key={author.name}>
              <td>{author.name}</td>
              <td>{author.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
