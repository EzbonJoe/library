"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FolderOpen } from "lucide-react";
import EmptyState from "./EmptyState";

type CategoryRow = { name: string; bookCount: number };

// Categories aren't a real table yet either — derived read-only from
// books.category, same caveat as AuthorsPage.
export default function CategoriesPage({ supabase }: { supabase: SupabaseClient }) {
  const [categories, setCategories] = useState<CategoryRow[] | null>(null);

  useEffect(() => {
    supabase
      .from("books")
      .select("category")
      .not("category", "is", null)
      .then(({ data }) => {
        const counts = new Map<string, number>();
        (data ?? []).forEach((row) => {
          if (!row.category) return;
          counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
        });
        setCategories(
          [...counts.entries()]
            .map(([name, bookCount]) => ({ name, bookCount }))
            .sort((a, b) => b.bookCount - a.bookCount),
        );
      });
  }, [supabase]);

  if (categories === null) {
    return (
      <div className="av-book-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="av-skeleton" style={{ height: 80 }} />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return <EmptyState icon={FolderOpen} title="No categories yet." />;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
      {categories.map((category) => (
        <div key={category.name} className="av-card" style={{ padding: 20 }}>
          <div style={{ fontFamily: "var(--av-font-display)", fontWeight: 600, fontSize: "1.4rem" }}>
            {category.name}
          </div>
          <div className="av-activity-meta" style={{ marginTop: 4 }}>
            {category.bookCount} book{category.bookCount === 1 ? "" : "s"}
          </div>
        </div>
      ))}
    </div>
  );
}
