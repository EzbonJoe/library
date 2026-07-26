import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Own top-level route (not inside the (site) group) for the same reason as
// /admin: this dashboard has its own sidebar/topbar, and the public site's
// fixed header previously stacked with (and intercepted clicks meant for)
// admin's own fixed UI when they shared a layout — see (site)/layout.tsx's
// comment for the full story.
export default function MyQuotesLayout({ children }: { children: React.ReactNode }) {
  return <div className={inter.variable}>{children}</div>;
}
