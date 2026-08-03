import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/public";
import QuoteCard, { type FeedQuote } from "@/components/QuoteCard";

export const revalidate = 3600;

const title = "Quotes About Tactics & Strategy | GadZeke";
const description =
  "Hand-picked quotes on tactics, strategy, and strategic thinking — pulled from 33 Strategies of War, Laws of Human Nature, Mastery, and more. Curated by GadZeke, not AI-generated.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/quotes-about-tactics" },
  openGraph: { title, description, url: "/quotes-about-tactics" },
};

// Keyword-matched rather than a dedicated category: "tactics" and "strategy"
// cut across several books' categories (Business, Psychology) rather than
// being a category of their own, so this pulls by quote text instead of
// the books.category column.
async function getQuotes(): Promise<FeedQuote[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id, text, editors_pick, book:books!inner(title, image, author, category, slug, status)")
    .eq("book.status", "published")
    .or("text.ilike.*tactic*,text.ilike.*strategy*,text.ilike.*strategic*")
    .order("id");
  return (data ?? []) as unknown as FeedQuote[];
}

export default async function QuotesAboutTacticsPage() {
  const quotes = await getQuotes();

  return (
    <main className="feed-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://gadzeke.com/" },
              {
                "@type": "ListItem",
                position: 2,
                name: "Quotes About Tactics & Strategy",
                item: "https://gadzeke.com/quotes-about-tactics",
              },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />

      <section className="hero">
        <h1 className="hero-heading">Quotes About Tactics & Strategy</h1>
        <p className="hero-subtext">Lessons in strategic thinking, pulled from the books that teach it best.</p>
      </section>

      <div className="quote-grid">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} variant="default" />
        ))}
      </div>
    </main>
  );
}
