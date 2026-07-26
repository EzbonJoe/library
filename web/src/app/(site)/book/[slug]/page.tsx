import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/public";
import { bookLink } from "@/lib/bookLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import BookQuotesSection from "@/components/BookQuotesSection";
import "@/styles/legacy/bookstyles.css";

export const revalidate = 3600;

async function getBook(slug: string) {
  const supabase = createClient();
  const { data: book } = await supabase
    .from("books")
    .select("id, title, author, category, image, slug, description")
    .ilike("slug", slug)
    .single();
  return book;
}

export async function generateStaticParams() {
  const supabase = createClient();
  const { data: books } = await supabase.from("books").select("slug").eq("status", "published");
  return (books ?? []).map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) return {};

  const byAuthor = book.author ? ` by ${book.author}` : "";
  const title = `${book.title} Quotes${byAuthor} | GadZeke`;
  const description = `Hand-picked quotes from ${book.title}${byAuthor}${
    book.category ? ` on ${book.category}` : ""
  } — curated by GadZeke, not AI-generated.`;
  const canonicalPath = bookLink(book.slug);

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: { type: "book", title, description, url: canonicalPath, images: [resolveCoverUrl(book.image)] },
    twitter: { card: "summary", title, description, images: [resolveCoverUrl(book.image)] },
  };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  const supabase = createClient();
  const [{ data: quotes }, { data: recommended }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, text, position, editors_pick")
      .eq("book_id", book.id)
      .order("position"),
    book.category
      ? supabase
          .from("books")
          .select("title, slug, image")
          .eq("category", book.category)
          .eq("status", "published")
          .neq("id", book.id)
          .limit(4)
      : Promise.resolve({ data: [] as { title: string; slug: string; image: string }[] }),
  ]);

  const canonicalUrl = `https://gadzeke.com${bookLink(book.slug)}`;
  const absoluteImageUrl = `https://gadzeke.com${resolveCoverUrl(book.image)}`;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.title,
            ...(book.author ? { author: { "@type": "Person", name: book.author } } : {}),
            image: absoluteImageUrl,
            url: canonicalUrl,
            ...(book.category ? { genre: book.category } : {}),
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
              { "@type": "ListItem", position: 3, name: book.title, item: canonicalUrl },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />

      <h1 className="book-heading">Quotes From {book.title}</h1>

      <BookQuotesSection book={book} quotes={quotes ?? []} />

      {recommended && recommended.length > 0 && (
        <div className="book-recommended">
          <h2 className="book-recommended-heading">More on {book.category}</h2>
          <div className="book-mini-grid">
            {recommended.map((otherBook) => (
              <Link key={otherBook.slug} className="book-mini-card" href={bookLink(otherBook.slug)}>
                <Image
                  src={resolveCoverUrl(otherBook.image)}
                  alt={`${otherBook.title} cover`}
                  width={300}
                  height={450}
                  sizes="(max-width: 640px) 45vw, 200px"
                  loading="lazy"
                />
                <div className="book-mini-card-title">{otherBook.title}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
