import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/public";
import { bookLink } from "@/lib/bookLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import "@/styles/legacy/body.css";

export const metadata: Metadata = {
  title: "Coming Soon | GadZeke",
  description: "This book's quotes are coming soon to GadZeke.",
  robots: { index: false, follow: true },
};

// Re-randomize suggestions on every visit, matching the old client-side
// script's behavior, instead of freezing one random pick at build time.
export const dynamic = "force-dynamic";

export default async function ComingSoonPage() {
  const supabase = createClient();
  const { data: books } = await supabase
    .from("books")
    .select("slug, title, image")
    .eq("status", "published");

  // Random order is intentional (this page is noindex and rendered fresh per
  // request) — disabling the purity rule rather than the rule's suggested
  // fix, which is meant for cacheable/replayable render output.
  // eslint-disable-next-line react-hooks/purity
  const suggestions = (books ?? []).sort(() => Math.random() - 0.5).slice(0, 4);

  return (
    <main>
      <h1 className="page-title">Coming Soon</h1>
      <p className="coming-soon-text">We haven&apos;t added quotes from this book yet — check back soon.</p>

      {suggestions.length > 0 && (
        <div className="suggestions">
          <h2 className="suggestions-heading">In the meantime, check out these</h2>
          <div className="suggestions-grid">
            {suggestions.map((book) => (
              <Link key={book.slug} href={bookLink(book.slug)}>
                <div className="book-container">
                  <div className="cover-frame">
                    <Image
                      className="image"
                      src={resolveCoverUrl(book.image)}
                      alt={`${book.title} cover`}
                      fill
                      sizes="(max-width: 640px) 45vw, 200px"
                      loading="lazy"
                    />
                  </div>
                  <div className="text-container">
                    <div className="book-title">{book.title}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
