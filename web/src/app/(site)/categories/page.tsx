import type { Metadata } from "next";
import Link from "next/link";

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

const description =
  "Browse GadZeke's hand-picked book quotes by category — Business, Psychology, Philosophy, Money, and more.";

export const metadata: Metadata = {
  title: "Browse by Category | GadZeke",
  description,
  alternates: { canonical: "/categories" },
  openGraph: { title: "Browse by Category | GadZeke", description, url: "/categories" },
};

export default function CategoriesPage() {
  return (
    <main className="feed-main">
      <section className="hero">
        <h1 className="hero-heading">Browse by Category</h1>
        <p className="hero-subtext">Every quote on GadZeke, sorted by the theme it speaks to.</p>
      </section>

      <div className="browse-grid">
        {CATEGORIES.map((category) => (
          <Link key={category} className="browse-card" href={`/?category=${category}`}>
            {category}
          </Link>
        ))}
      </div>
    </main>
  );
}
