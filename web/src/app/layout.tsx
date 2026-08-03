import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Analytics from "@/components/Analytics";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL("https://gadzeke.com"),
    // No template: every page's own title already includes the site name in
    // its own format ("About GadZeke", "X | GadZeke", "X — GadZeke") — a
    // "%s — GadZeke" template here would double it up on every single page,
    // not just this one. A plain string still acts as the fallback for any
    // route that doesn't set its own title (same as `default` would,
    // without TypeScript requiring a `template` alongside it).
    title: `${settings.siteName} — ${settings.siteTagline}`,
    description: settings.seoDescription,
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      images: [settings.ogImageUrl],
    },
    twitter: {
      card: "summary",
      images: [settings.ogImageUrl],
    },
    icons: {
      icon: "/icons/favicon-logo.png",
      apple: "/icons/apple-touch-icon.png",
    },
    verification: {
      google: "0w4K5NJ-pqjsc2m85-1xPzD56Pc0klw5v9ndY3Je50A",
    },
  };
}

// Without this, mobile browsers color the status/URL bar area with their
// own default instead of the page's actual background -- most visible in
// dark mode as a mismatched blank strip above the app content. The light
// value here is the first-paint default; themeInitScript below corrects it
// to dark before paint when that's the stored/preferred theme, and
// useThemeToggle keeps it in sync after any later toggle.
export const viewport: Viewport = {
  themeColor: "#FAFAF8",
};

const CLASH_DISPLAY_CSS_URL = "https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap";

// A plain `rel="stylesheet"` link here would block first paint on every
// single page behind a round trip to a third-party host, for a font that
// every one of its call sites already lists 'Manrope' as a fallback for --
// and Manrope is self-hosted via next/font above, so there's no visual
// reason to block on it. `media="print"` makes the browser fetch it without
// applying (or blocking render for) it; the script right after flips it to
// `media="all"` the moment it's parsed, applying the swap as soon as the
// (already in-flight) download finishes instead of holding up paint.
const loadClashDisplayScript = `
(function () {
  var link = document.getElementById('clash-display-css');
  if (link) link.media = 'all';
})();
`;

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
    if (isDark) {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#0D1117');
    }
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
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        {/* Login/signup (and admin login) load the Turnstile captcha
            entirely client-side, on demand -- warming this connection here
            means the widget's own script/iframe requests don't have to pay
            for DNS+TLS setup on top of the JS chain that triggers them. */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" crossOrigin="" />
        <link
          id="clash-display-css"
          rel="stylesheet"
          media="print"
          href={CLASH_DISPLAY_CSS_URL}
        />
        <script dangerouslySetInnerHTML={{ __html: loadClashDisplayScript }} />
        <noscript>
          <link rel="stylesheet" href={CLASH_DISPLAY_CSS_URL} />
        </noscript>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
