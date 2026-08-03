import Link from "next/link";

type HeroQuote = { text: string; book: { title: string; author: string | null } } | null;

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Hero({ name, heroQuote }: { name: string; heroQuote: HeroQuote }) {
  return (
    <section className="ud-hero">
      <h1 className="ud-hero-greeting">
        {timeOfDayGreeting()}, {name} 👋
      </h1>
      <p className="ud-hero-subtext">Ready to discover something inspiring today?</p>

      {heroQuote && (
        <div className="ud-hero-quote">
          <span className="ud-hero-quote-mark" aria-hidden="true">
            &ldquo;
          </span>
          <p className="ud-hero-quote-text">{heroQuote.text}</p>
          <p className="ud-hero-quote-book">
            — {heroQuote.book.title}
            {heroQuote.book.author ? `, ${heroQuote.book.author}` : ""}
          </p>
          <Link href="/#feed" className="ud-btn ud-btn-primary ud-hero-quote-cta">
            Explore Quotes
          </Link>
        </div>
      )}
    </section>
  );
}
