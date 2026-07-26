import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Analytics from "@/components/Analytics";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gadzeke.com"),
  title: {
    default: "GadZeke — Words That Change Perspectives",
    template: "%s — GadZeke",
  },
  description:
    "Discover timeless, hand-picked quotes from the world's greatest business, psychology, and philosophy books — curated by GadZeke, not AI-generated.",
  openGraph: {
    type: "website",
    siteName: "GadZeke",
    images: ["/icons/logo-social.png"],
  },
  twitter: {
    card: "summary",
    images: ["/icons/logo-social.png"],
  },
  icons: {
    icon: "/icons/favicon-logo.png",
    apple: "/icons/apple-touch-icon.png",
  },
  verification: {
    google: "0w4K5NJ-pqjsc2m85-1xPzD56Pc0klw5v9ndY3Je50A",
  },
};

// Reads the theme choice before paint so pages never flash the wrong theme —
// mirrors scripts/darkmode.js's localStorage['display-color'] + data-theme
// attribute convention from the current static site, ported as-is.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('display-color');
    var isDark = stored !== null
      ? JSON.parse(stored)
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
