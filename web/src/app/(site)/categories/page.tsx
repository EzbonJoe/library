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

const title = "Quotes by Category: Business, Money, Psychology & More | GadZeke";
const description =
  "Hand-picked book quotes sorted by category — Business, Psychology, Philosophy, Money, Leadership, and more. Curated by GadZeke, not AI-generated.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/categories" },
  openGraph: { title, description, url: "/categories" },
};

export default function CategoriesPage() {
  return (
    <main className="feed-main">
      <section className="hero">
        <h1 className="hero-heading">Book Quotes by Category</h1>
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
