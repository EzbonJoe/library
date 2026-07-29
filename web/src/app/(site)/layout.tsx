import SiteHeader from "@/components/SiteHeader";
import SearchOverlay from "@/components/SearchOverlay";
import SiteFooter from "@/components/SiteFooter";
import { getSiteSettings } from "@/lib/settings";

// Public-site chrome (header, search overlay, footer) — split into its own
// route group so /admin, which has its own header/sidebar, doesn't inherit
// this. Previously both lived under the same root layout, and the public
// site's fixed header ended up visually stacking with (and intercepting
// clicks meant for) the admin dashboard's own fixed-position UI.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <div className="feed-page has-fixed-header min-h-full flex flex-col bg-canvas text-ink">
      <SiteHeader siteName={settings.siteName} />
      <SearchOverlay />
      {children}
      <SiteFooter
        curatorText={settings.footerCuratorText}
        copyrightText={settings.footerCopyrightText}
        youtubeUrl={settings.youtubeUrl}
        instagramUrl={settings.instagramUrl}
        twitterUrl={settings.twitterUrl}
        facebookUrl={settings.facebookUrl}
      />
    </div>
  );
}
