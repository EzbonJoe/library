"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { GA_MEASUREMENT_ID, CLARITY_PROJECT_ID } from "@/lib/config";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// This is a client-navigated (App Router) site -- gtag's own automatic
// pageview only fires once, on the very first script load, so every
// subsequent in-app navigation (clicking between books, quotes, etc.) would
// otherwise go completely uncounted in GA4. send_page_view: false below
// disables that one automatic firing, and this fires the equivalent event
// on mount *and* on every later pathname/query change, so each navigation
// -- including the first -- is counted exactly once. Needs its own
// Suspense boundary because useSearchParams opts the tree under it out of
// static rendering; scoping that to just this tracker keeps the rest of
// the layout static.
function GA4PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!window.gtag) return;
    const query = searchParams.toString();
    window.gtag("event", "page_view", {
      page_path: query ? `${pathname}?${query}` : pathname,
    });
  }, [pathname, searchParams]);

  return null;
}

// Loaded once in the root layout, so it covers every route (public site,
// admin, dashboard) — both scripts are genuinely optional: unset in local
// dev, they just don't render rather than injecting a broken tag pointed at
// an empty ID.
export default function Analytics() {
  return (
    <>
      {GA_MEASUREMENT_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
            `}
          </Script>
          <Suspense fallback={null}>
            <GA4PageviewTracker />
          </Suspense>
        </>
      )}
      {CLARITY_PROJECT_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
          `}
        </Script>
      )}
    </>
  );
}
