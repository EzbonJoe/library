import type { NextConfig } from "next";

// The old static site had 13 hand-authored legacy book pages (kept only to
// preserve their clean URLs for SEO — see the old scripts/legacySlugs.js)
// plus a dynamic book.html?book=slug template. Every book now resolves
// through the single /book/[slug] route, so both old URL shapes 301 here
// instead.
const LEGACY_BOOK_SLUGS = [
  "Quotes-From-33-Strategies-Of-War",
  "Quotes-from-Mastery",
  "Quotes-From-Goals-by-Brian-Tracy",
  "Quotes-From-The-Monk-Who-Sold-His-Ferrari",
  "Quotes-From-How-To-Lead-The-Family-Business",
  "Quotes-From-The-Millionaire-Fastlane",
  "Quotes-from-The-5am-Club",
  "Quotes-From-Secrets-Of-Closing-A-Sell",
  "Quotes-From-Laws-of-Human-Nature",
  "Quotes-From-The-Richest-Man-In-Babylon",
  "Quotes-From-Rich-Dad-Poor-Dad",
  "Quotes-From-How-To-Win-Friends-And-Influence-People",
  "Quotes-From-7-Habits-of-Highly-Effective-People",
];

const nextConfig: NextConfig = {
  images: {
    // Book covers added via the admin are full Supabase Storage URLs (the
    // 18 original books use root-relative /images/* paths instead, which
    // next/image handles automatically without needing to be listed here).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "honghcqqtehmdjhcvxup.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      ...LEGACY_BOOK_SLUGS.map((slug) => ({
        source: `/${slug.toLowerCase()}`,
        destination: `/book/${slug}`,
        permanent: true,
      })),
      {
        source: "/book.html",
        has: [{ type: "query" as const, key: "book", value: "(?<slug>.*)" }],
        destination: "/book/:slug",
        permanent: true,
      },
      {
        source: "/best-book-quotes-and-the-books-they-come-from",
        destination: "/books",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
