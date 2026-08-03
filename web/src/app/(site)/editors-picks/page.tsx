import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/public";
import QuoteCard, { type FeedQuote } from "@/components/QuoteCard";

export const revalidate = 3600;

const title = "Editor's Picks: Our Favorite Quotes | GadZeke";
const description =
  "The most iconic, most-recognized lines from every book in our library — hand-picked by GadZeke, not AI-generated.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/editors-picks" },
  openGraph: { title, description, url: "/editors-picks" },
};

async function getQuotes(): Promise<FeedQuote[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id, text, editors_pick, book:books!inner(title, image, author, category, slug, status)")
    .eq("book.status", "published")
    .eq("editors_pick", true)
    .order("id");
  return (data ?? []) as unknown as FeedQuote[];
}

export default async function EditorsPicksPage() {
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
              { "@type": "ListItem", position: 2, name: "Editor's Picks", item: "https://gadzeke.com/editors-picks" },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />

      <section className="hero">
        <h1 className="hero-heading">Editor&apos;s Picks</h1>
        <p className="hero-subtext">The lines readers quote most, pulled from every book in our library.</p>
      </section>

      <div className="quote-grid">
        {quotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} variant="default" />
        ))}
      </div>
    </main>
  );
}
