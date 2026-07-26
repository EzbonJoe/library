import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/public";

const description = "Every author featured on GadZeke, browse their books and quotes in one place.";

export const metadata: Metadata = {
  title: "Browse by Author | GadZeke",
  description,
  alternates: { canonical: "/authors" },
  openGraph: { title: "Browse by Author | GadZeke", description, url: "/authors" },
};

export const revalidate = 3600;

export default async function AuthorsPage() {
  const supabase = createClient();
  const { data: books } = await supabase.from("books").select("author").not("author", "is", null).order("author");

  const authors = [...new Set((books ?? []).map((book) => book.author).filter((a): a is string => Boolean(a)))];

  return (
    <main className="feed-main">
      <section className="hero">
        <h1 className="hero-heading">Browse by Author</h1>
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
