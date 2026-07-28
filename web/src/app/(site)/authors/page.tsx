import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/public";

const title = "Book Quotes by Author | GadZeke";
const description =
  "Hand-picked quotes organized by author — browse every writer featured on GadZeke and jump straight to their books and quotes.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/authors" },
  openGraph: { title, description, url: "/authors" },
};

export const revalidate = 3600;

export default async function AuthorsPage() {
  const supabase = createClient();
  const { data: books } = await supabase.from("books").select("author").not("author", "is", null).order("author");

  const authors = [...new Set((books ?? []).map((book) => book.author).filter((a): a is string => Boolean(a)))];

  return (
    <main className="feed-main">
      <section className="hero">
        <h1 className="hero-heading">Book Quotes by Author</h1>
        <p className="hero-subtext">Every author featured on GadZeke, in one place.</p>
      </section>

      <div className="browse-grid">
        {authors.map((author) => (
          <Link key={author} className="browse-card" href={`/?author=${encodeURIComponent(author)}`}>
            {author}
          </Link>
        ))}
      </div>
    </main>
  );
}
