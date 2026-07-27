import type { Metadata } from "next";
import "@/styles/legacy/legal.css";

const description = "GadZeke's privacy policy — what we collect, what we don't, and why.";

export const metadata: Metadata = {
  title: "Privacy Policy — GadZeke",
  description,
  alternates: { canonical: "/privacy-policy" },
  openGraph: { title: "Privacy Policy — GadZeke", description, url: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-main">
      <h1 className="page-title">Privacy Policy</h1>
      <p className="legal-updated">Last updated July 2026</p>

      <p>
        GadZeke is a small, personally curated site sharing quotes from books. This page explains
        what little information we collect and how it&apos;s used — in plain language, not legal
        boilerplate.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Nothing, if you&apos;re just browsing.</strong> You don&apos;t need an account to
          read quotes, search, or filter by category.
        </li>
        <li>
          <strong>Bookmarks.</strong> When you bookmark a quote, it&apos;s saved only in your own
          browser&apos;s local storage. It never reaches our servers and no one else can see it.
        </li>
        <li>
          <strong>Your light/dark mode preference</strong> is saved the same way — locally, on your
          device only.
        </li>
        <li>
          <strong>If you email us</strong> (via the Contact page or otherwise), we&apos;ll have
          whatever you choose to include — your address, name, and message — used only to reply to
          you.
        </li>
        <li>
          <strong>Basic server logs</strong> (like IP address and browser type) may be recorded by
          our hosting provider, as with virtually any website, for security and troubleshooting
          only.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We don&apos;t use advertising or tracking cookies. The only client-side storage we use is
        your browser&apos;s local storage, for the two preferences described above.
      </p>

      <h2>Third-party services</h2>
      <ul>
        <li>
          <strong>Google Fonts and Fontshare</strong> serve the fonts used on this site, and may log
          basic request information as part of that — standard for any site using web fonts.
        </li>
        <li>
          <strong>Supabase</strong> powers our database, search, and admin login. Browsing the site
          doesn&apos;t require you to share any personal data with Supabase.
        </li>
      </ul>

      <h2>Children&apos;s privacy</h2>
      <p>
        GadZeke isn&apos;t directed at children, and we don&apos;t knowingly collect information
        from anyone under 13.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If this policy changes, we&apos;ll update this page. Continuing to use the site after a
        change means you accept the update.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email{" "}
        <a href="mailto:ramizeke516@gmail.com">ramizeke516@gmail.com</a>.
      </p>
    </main>
  );
}
