import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/public";
import { buildStatsMap, fetchAllQuotes } from "@/lib/bookStats";
import BooksPageClient from "@/components/BooksPageClient";
import "@/styles/legacy/books-page.css";

export const revalidate = 3600;

const description =
  "Browse every book on GadZeke and read hand-picked quotes from each — search the library or explore by category.";

export const metadata: Metadata = {
  title: "Browse All Books & Quotes | GadZeke",
  description,
  alternates: { canonical: "/books" },
  openGraph: { title: "Browse All Books & Quotes | GadZeke", description, url: "/books" },
};

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; saved?: string }>;
}) {
  const [{ search, saved }, supabase] = [await searchParams, createClient()];
  const [{ data: books }, quotes] = await Promise.all([
    supabase.from("books").select("*"),
    fetchAllQuotes(supabase),
  ]);

  const statsMap = buildStatsMap(books ?? [], quotes);
  // Map isn't guaranteed serializable across the Server->Client Component
  // boundary — pass plain entries and let the client rebuild the Map.
  const statsEntries = Array.from(statsMap.entries());

  return (
    <main className="feed-main">
      <BooksPageClient
        books={books ?? []}
        statsEntries={statsEntries}
        initialSearch={search ?? ""}
        initialSaved={saved === "true"}
      />
    </main>
  );
}
