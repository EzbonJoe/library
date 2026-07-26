import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // "feed-page" carries no markup — it only defines the --feed-* CSS
  // variables (styles/legacy/feed.css) that the still-unmigrated Quotes and
  // Subscribers panels depend on. Splitting the public site into its own
  // (site) route group (to stop its header from bleeding into /admin) also
  // removed this class from admin's tree, since the class had been living
  // on the old shared root layout's <body>. Reapplying it here fixes the
  // legacy panels' styling without reintroducing the public header/footer
  // components that caused the original bug.
  return <div className={`${inter.variable} feed-page`}>{children}</div>;
}
