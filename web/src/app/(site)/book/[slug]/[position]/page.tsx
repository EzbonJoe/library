import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/public";
import { bookLink } from "@/lib/bookLink";
import { quoteLink } from "@/lib/quoteLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import QuotePageClient from "@/components/QuotePageClient";
import "@/styles/legacy/bookstyles.css";

export const revalidate = 3600;

type BookRow = {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  category: string | null;
  image: string;
  status: string;
};

type QuoteRow = { id: number; text: string; position: number; book_id: number };

// ~1030 quote pages each independently querying Supabase for their book,
// their own row, their prev/next neighbor, and "more from this book" adds
// up to 4-5 round trips x 1030 pages during static export -- that's what
// actually overwhelmed the free-tier connection/rate limit on the first
// build attempt (workers timing out after 60s, not a code bug). Both
// tables are small enough to hold in memory entirely, so this loads each
// ONCE and every page below reads from that -- a module-level singleton
// promise, not React's cache() (which is scoped per-request and wouldn't
// share across the ~1030 separate page generations in the same build).
let allDataPromise: Promise<{ books: BookRow[]; quotes: QuoteRow[] }> | null = null;

// PostgREST caps any unpaginated select at this project's max-rows setting
// (1000 here) -- with 1273 quotes in the table, a plain .select() silently
// dropped the last ~270 rows, so whole books past that cutoff never got a
// generateStaticParams entry and 404'd on every quote page. Paging through
// with .range() until a partial page comes back is the only way to get
// every row regardless of how large the table grows.
async function fetchAllRows<T>(supabase: ReturnType<typeof createClient>, table: string, columns: string): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  // .range() pagination without a stable order can skip or repeat rows if
  // the underlying scan order shifts between requests -- ordering by id
  // (same fix already applied in lib/bookStats.ts's fetchAllQuotes) keeps
  // every page's boundary deterministic.
  for (let from = 0; ; from += pageSize) {
    const { data } = await supabase.from(table).select(columns).order("id").range(from, from + pageSize - 1);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

function loadAllData() {
  if (!allDataPromise) {
    allDataPromise = (async () => {
      const supabase = createClient();
      const [books, quotes] = await Promise.all([
        fetchAllRows<BookRow>(supabase, "books", "id, slug, title, author, category, image, status"),
        fetchAllRows<QuoteRow>(supabase, "quotes", "id, text, position, book_id"),
      ]);
      return { books, quotes };
    })();
  }
  return allDataPromise;
}

async function getBookBySlug(slug: string): Promise<BookRow | null> {
  const { books } = await loadAllData();
  return books.find((b) => b.slug.toLowerCase() === slug.toLowerCase()) ?? null;
}

async function getBookQuotes(bookId: number): Promise<QuoteRow[]> {
  const { quotes } = await loadAllData();
  return quotes.filter((q) => q.book_id === bookId).sort((a, b) => a.position - b.position);
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

export async function generateStaticParams() {
  const { books, quotes } = await loadAllData();
  const publishedById = new Map(books.filter((b) => b.status === "published").map((b) => [b.id, b]));

  return quotes
    .filter((q) => publishedById.has(q.book_id))
    .map((q) => ({ slug: publishedById.get(q.book_id)!.slug, position: String(q.position) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; position: string }>;
}): Promise<Metadata> {
  const { slug, position } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return {};
  const bookQuotes = await getBookQuotes(book.id);
  const quote = bookQuotes.find((q) => q.position === Number(position));
  if (!quote) return {};

  const byAuthor = book.author ? ` by ${book.author}` : "";
  const shortQuote = truncate(quote.text, 70);
  const title = `"${shortQuote}" — ${book.title}${byAuthor} | GadZeke`;
  const description = `${truncate(quote.text, 150)} — from ${book.title}${byAuthor}, curated by GadZeke, not AI-generated.`;
  const canonicalPath = quoteLink(book.slug, quote.position);

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { type: "article", title, description, url: canonicalPath, images: [resolveCoverUrl(book.image)] },
    twitter: { card: "summary", title, description, images: [resolveCoverUrl(book.image)] },
  };
}

export default async function QuotePage({
  params,
}: {
  params: Promise<{ slug: string; position: string }>;
}) {
  const { slug, position } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const positionNum = Number(position);
  const bookQuotes = await getBookQuotes(book.id);
  const quote = bookQuotes.find((q) => q.position === positionNum);
  if (!quote) notFound();

  const prevQuote = bookQuotes.find((q) => q.position === positionNum - 1) ?? null;
  const nextQuote = bookQuotes.find((q) => q.position === positionNum + 1) ?? null;
  const moreQuotes = bookQuotes.filter((q) => q.position !== positionNum).slice(0, 4);

  const canonicalUrl = `https://gadzeke.com${quoteLink(book.slug, quote.position)}`;
  const bookUrl = `https://gadzeke.com${bookLink(book.slug)}`;
  const absoluteImageUrl = `https://gadzeke.com${resolveCoverUrl(book.image)}`;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Quotation",
            text: quote.text,
            url: canonicalUrl,
            isPartOf: {
              "@type": "Book",
              name: book.title,
              url: bookUrl,
              image: absoluteImageUrl,
              ...(book.author ? { author: { "@type": "Person", name: book.author } } : {}),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://gadzeke.com/" },
              { "@type": "ListItem", position: 2, name: "Books", item: "https://gadzeke.com/books" },
              { "@type": "ListItem", position: 3, name: book.title, item: bookUrl },
              { "@type": "ListItem", position: 4, name: `Quote ${quote.position}`, item: canonicalUrl },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />

      <p className="quote-page-crumb">
        <Link href={bookLink(book.slug)}>{book.title}</Link> — Quote {quote.position}
      </p>

      <section className="quote-page-hero">
        <p className="quote-page-text">&ldquo;{quote.text}&rdquo;</p>
        <QuotePageClient quoteId={quote.id} quoteText={quote.text} />
      </section>

      <div className="quote-page-book">
        <Image src={resolveCoverUrl(book.image)} alt={`${book.title} cover`} width={64} height={96} />
        <div>
          <div className="quote-page-book-title">{book.title}</div>
          {book.author && <div className="quote-page-book-author">{book.author}</div>}
        </div>
        <Link className="quote-page-book-link" href={bookLink(book.slug)}>
          Read all quotes
        </Link>
      </div>

      <div className="quote-page-nav">
        {prevQuote ? (
          <Link className="quote-page-nav-link" href={quoteLink(book.slug, prevQuote.position)}>
            <span className="quote-page-nav-label">← Previous</span>
            Quote {prevQuote.position}
          </Link>
        ) : (
          <span />
        )}
        {nextQuote ? (
          <Link className="quote-page-nav-link is-next" href={quoteLink(book.slug, nextQuote.position)}>
            <span className="quote-page-nav-label">Next →</span>
            Quote {nextQuote.position}
          </Link>
        ) : (
          <span />
        )}
      </div>

      {moreQuotes.length > 0 && (
        <div className="book-recommended">
          <h2 className="book-recommended-heading">More quotes from {book.title}</h2>
          <div className="js-quotes">
            {moreQuotes.map((q) => (
              <Link key={q.id} className="quotes" href={quoteLink(book.slug, q.position)} style={{ display: "block" }}>
                <div className="quote-number">{q.position}</div>
                <p className="quote-text">{q.text}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
