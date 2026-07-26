import SiteHeader from "@/components/SiteHeader";
import SearchOverlay from "@/components/SearchOverlay";
import SiteFooter from "@/components/SiteFooter";

// Public-site chrome (header, search overlay, footer) — split into its own
// route group so /admin, which has its own header/sidebar, doesn't inherit
// this. Previously both lived under the same root layout, and the public
// site's fixed header ended up visually stacking with (and intercepting
// clicks meant for) the admin dashboard's own fixed-position UI.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="feed-page min-h-full flex flex-col bg-canvas text-ink">
      <SiteHeader />
      <SearchOverlay />
      {children}
      <SiteFooter />
    </div>
  );
}
