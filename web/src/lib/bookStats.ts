export type Book = {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  category: string | null;
  image: string;
  status: string;
  featured: boolean;
  description: string | null;
  created_at: string;
};

export type BookStats = {
  count: number;
  totalWords: number;
  hasEditorsPick: boolean;
  sampleQuote: string | null;
  samplePriority: number;
  isNew: boolean;
};

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export function buildStatsMap(
  books: Book[],
  quotes: { book_id: number; text: string; editors_pick: boolean; position: number }[],
): Map<number, BookStats> {
  const statsMap = new Map<number, BookStats>();

  for (const quote of quotes) {
    if (!statsMap.has(quote.book_id)) {
      statsMap.set(quote.book_id, {
        count: 0,
        totalWords: 0,
        hasEditorsPick: false,
        sampleQuote: null,
        samplePriority: -1,
        isNew: false,
      });
    }

    const entry = statsMap.get(quote.book_id)!;
    entry.count += 1;
    entry.totalWords += quote.text.trim().split(/\s+/).length;
    if (quote.editors_pick) entry.hasEditorsPick = true;

    const priority = quote.editors_pick ? 2 : quote.position === 1 ? 1 : 0;
    if (priority > entry.samplePriority) {
      entry.sampleQuote = quote.text;
      entry.samplePriority = priority;
    }
  }

  const now = Date.now();
  for (const book of books) {
    const entry = statsMap.get(book.id) ?? {
      count: 0,
      totalWords: 0,
      hasEditorsPick: false,
      sampleQuote: null,
      samplePriority: -1,
      isNew: false,
    };
    entry.isNew = now - new Date(book.created_at).getTime() < TWO_WEEKS_MS;
    statsMap.set(book.id, entry);
  }

  return statsMap;
}

// Supabase caps a single select() at 1000 rows by default, and this project
// has more quotes than that — paginate with .range() so stats never
// silently undercount books whose quotes land past the first page.
export async function fetchAllQuotes(
  supabase: ReturnType<typeof import("@/lib/supabase/public").createClient>,
) {
  const PAGE_SIZE = 1000;
  const rows: { book_id: number; text: string; editors_pick: boolean; position: number }[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("quotes")
      .select("book_id, text, editors_pick, position")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}
