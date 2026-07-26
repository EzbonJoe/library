"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Search, Plus, BookOpen, Star, Trash2 } from "lucide-react";
import BookCard, { type BookRow } from "./BookCard";
import BookFormSlideover from "./BookFormSlideover";
import EmptyState from "./EmptyState";

const PAGE_SIZE = 12;
const CATEGORIES = [
  "Business",
  "Psychology",
  "Philosophy",
  "Money",
  "Relationships",
  "Leadership",
  "Success",
  "Habits",
  "Spirituality",
  "Productivity",
];

async function fetchBooks(supabase: SupabaseClient): Promise<BookRow[]> {
  const { data: bookRows } = await supabase
    .from("books")
    .select("id, title, author, category, status, image, slug, description, featured, created_at")
    .order("created_at", { ascending: false });

  const books = bookRows ?? [];

  // One count-only query per book rather than fetching every quote's
  // book_id — the latter silently truncates at Supabase's default 1000-row
  // response cap, undercounting (sometimes to 0) whichever books' quotes
  // happened to fall past that cutoff once the library passed ~1000 quotes.
  const counts = await Promise.all(
    books.map((book) =>
      supabase.from("quotes").select("id", { count: "exact", head: true }).eq("book_id", book.id),
    ),
  );

  return books.map((book, index) => ({
    ...book,
    quoteCount: counts[index].count ?? 0,
  }));
}

export default function BooksPage({
  supabase,
  autoOpenAdd,
  onBooksChanged,
}: {
  supabase: SupabaseClient;
  autoOpenAdd: boolean;
  onBooksChanged?: () => void;
}) {
  const [books, setBooks] = useState<BookRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState<"title" | "author" | "newest">("newest");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  // Seeded straight from the prop rather than compared against a "did it
  // change" ref/state: this component unmounts and remounts on every tab
  // switch (AdminApp only renders the active tab), so quick-add navigating
  // here from a different tab means this is a fresh mount where the signal
  // was already incremented *before* first render — a change-detection
  // comparison can never see that as "new" on the render it needs to.
  const [slideoverOpen, setSlideoverOpen] = useState(autoOpenAdd);
  const [editingBook, setEditingBook] = useState<BookRow | null>(null);

  // Reusable reload for handlers (delete/feature/duplicate/save) — calling
  // this from an event handler is fine; it's only calling it *from an
  // effect* that the lint rule below cares about.
  const reload = useCallback(async () => {
    setBooks(await fetchBooks(supabase));
    onBooksChanged?.();
    // Deliberately excluding onBooksChanged: it's just "bump a counter" in
    // the parent, and including it would change this callback's identity
    // every render (parent passes an inline function).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    fetchBooks(supabase).then((rows) => {
      if (!cancelled) setBooks(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    if (!books) return [];
    const term = search.trim().toLowerCase();
    let result = books.filter((book) => {
      const matchesTerm =
        !term || book.title.toLowerCase().includes(term) || (book.author ?? "").toLowerCase().includes(term);
      const matchesCategory = !categoryFilter || book.category === categoryFilter;
      const matchesStatus = !statusFilter || book.status === statusFilter;
      return matchesTerm && matchesCategory && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "author") return (a.author ?? "").localeCompare(b.author ?? "");
      return 0; // "newest" — already in created_at desc order from the query
    });

    return result;
  }, [books, search, categoryFilter, statusFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Same during-render adjustment pattern: reset to page 1 whenever the
  // filters actually change, without an extra effect-triggered render.
  const [lastFilterKey, setLastFilterKey] = useState(`${search}|${categoryFilter}|${statusFilter}`);
  const filterKey = `${search}|${categoryFilter}|${statusFilter}`;
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this book and all of its quotes? This cannot be undone.")) return;
    await supabase.from("books").delete().eq("id", id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    reload();
  }

  async function handleToggleFeature(book: BookRow) {
    await supabase.from("books").update({ featured: !book.featured }).eq("id", book.id);
    reload();
  }

  async function handleDuplicate(book: BookRow) {
    // Runs only from a button onClick (never during render); Date.now() just
    // needs a unique slug suffix.
    // eslint-disable-next-line react-hooks/purity
    const slug = `${book.slug}-copy-${Date.now().toString(36)}`;
    await supabase.from("books").insert({
      title: `${book.title} (Copy)`,
      author: book.author,
      category: book.category,
      description: book.description,
      image: book.image,
      status: "coming_soon",
      featured: false,
      slug,
    });
    reload();
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} book(s) and all of their quotes? This cannot be undone.`)) return;
    await supabase.from("books").delete().in("id", [...selected]);
    setSelected(new Set());
    reload();
  }

  async function handleBulkFeature() {
    if (selected.size === 0) return;
    await supabase.from("books").update({ featured: true }).in("id", [...selected]);
    setSelected(new Set());
    reload();
  }

  function openEdit(book: BookRow) {
    setEditingBook(book);
    setSlideoverOpen(true);
  }

  function openAdd() {
    setEditingBook(null);
    setSlideoverOpen(true);
  }

  return (
    <div>
      <div className="av-toolbar">
        <div className="av-search-input">
          <Search />
          <input
            type="text"
            placeholder="Search books by title or author..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select className="av-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
        <select className="av-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="coming_soon">Coming soon</option>
        </select>
        <select className="av-select" value={sortKey} onChange={(event) => setSortKey(event.target.value as typeof sortKey)}>
          <option value="newest">Newest first</option>
          <option value="title">Title A–Z</option>
          <option value="author">Author A–Z</option>
        </select>
        <button type="button" className="av-btn av-btn-primary" onClick={openAdd} style={{ marginLeft: "auto" }}>
          <Plus />
          Add Book
        </button>
      </div>

      {selected.size > 0 && (
        <div className="av-bulk-bar">
          <span>{selected.size} selected</span>
          <button type="button" className="av-btn av-btn-secondary av-btn-sm" onClick={handleBulkFeature}>
            <Star size={14} />
            Feature
          </button>
          <button type="button" className="av-btn av-btn-danger av-btn-sm" onClick={handleBulkDelete}>
            <Trash2 size={14} />
            Delete
          </button>
          <button type="button" className="av-btn av-btn-secondary av-btn-sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {books === null ? (
        <div className="av-book-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="av-skeleton av-skeleton-book" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={books.length === 0 ? "No books yet." : "No books match your filters."}
          actionLabel={books.length === 0 ? "Add First Book" : undefined}
          onAction={books.length === 0 ? openAdd : undefined}
        />
      ) : (
        <>
          <div className="av-book-grid">
            {pageItems.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                selected={selected.has(book.id)}
                onToggleSelect={() => toggleSelect(book.id)}
                onEdit={() => openEdit(book)}
                onDelete={() => handleDelete(book.id)}
                onToggleFeature={() => handleToggleFeature(book)}
                onDuplicate={() => handleDuplicate(book)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`av-btn av-btn-sm ${page === i + 1 ? "av-btn-primary" : "av-btn-secondary"}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <BookFormSlideover
        supabase={supabase}
        isOpen={slideoverOpen}
        editingBook={editingBook}
        onClose={() => setSlideoverOpen(false)}
        onSaved={reload}
      />
    </div>
  );
}
