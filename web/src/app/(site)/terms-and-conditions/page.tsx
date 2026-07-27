import type { Metadata } from "next";
import "@/styles/legacy/legal.css";

const description = "GadZeke's terms and conditions for using the site.";

export const metadata: Metadata = {
  title: "Terms & Conditions — GadZeke",
  description,
  alternates: { canonical: "/terms-and-conditions" },
  openGraph: { title: "Terms & Conditions — GadZeke", description, url: "/terms-and-conditions" },
};

export default function TermsPage() {
  return (
    <main className="legal-main">
      <h1 className="page-title">Terms &amp; Conditions</h1>
      <p className="legal-updated">Last updated July 2026</p>

      <p>
        By using GadZeke, you agree to the terms below. This site is a personal project, and these
        terms are written to be straightforward rather than exhaustive.
      </p>

      <h2>About the content</h2>
      <p>
        The quotes on GadZeke are excerpts hand-picked from published books, shared for personal
        inspiration, commentary, and educational purposes. Each excerpt belongs to its original
        author and publisher — GadZeke doesn&apos;t claim ownership of the books quoted, only of the
        way they&apos;re organized and presented here.
      </p>

      <h2>Using the site</h2>
      <ul>
        <li>GadZeke is free to browse, search, and bookmark quotes from.</li>
        <li>
          Please don&apos;t scrape the site at scale, attempt to access the admin area without
          authorization, or otherwise misuse it in a way that disrupts the experience for other
          readers.
        </li>
      </ul>

      <h2>Not professional advice</h2>
      <p>
        Quotes are shared for inspiration and reflection. Nothing on GadZeke is financial, legal,
        medical, or professional advice, regardless of the book or topic it&apos;s drawn from.
      </p>

      <h2>External links</h2>
      <p>
        GadZeke may link to third-party sites (for example, a book&apos;s publisher). We aren&apos;t
        responsible for the content or practices of sites we don&apos;t control.
      </p>

      <h2>No warranty</h2>
      <p>
        GadZeke is provided as-is, without warranties of any kind. We do our best to keep quotes
        accurate and the site running smoothly, but we can&apos;t guarantee it will always be
        available or error-free.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        These terms may be updated occasionally. Continuing to use the site after a change means you
        accept the update.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:ramizeke516@gmail.com">ramizeke516@gmail.com</a>.
      </p>
    </main>
  );
}
