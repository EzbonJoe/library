// Drop your real Amazon Associates tracking tag in here once approved
// (e.g. 'gadzeke-20'). Until then, links still work, they just won't earn commission.
export const AMAZON_AFFILIATE_TAG = "gadzeke-20-placeholder";

// Cloudflare Turnstile site key for the signup form's CAPTCHA. This is
// Cloudflare's own published test key — it always passes verification, so
// signup works out of the box in development. Get a real site key at
// https://dash.cloudflare.com (Turnstile) and swap it in before launch, and
// enable CAPTCHA protection with the matching secret key in the Supabase
// dashboard under Authentication > Attack Protection, or signUp() will
// succeed here but Supabase will silently accept requests without actually
// verifying the token server-side.
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

// Matches the UID hardcoded into every admin-locked RLS policy across
// supabase/migration-*.sql (search for it there before changing this). Not a
// secret -- it's already baked into those migration files -- used here only
// to bounce any other authenticated session out of /admin immediately
// instead of rendering the dashboard shell and relying solely on RLS to
// silently no-op their reads/writes once they're already looking at it.
export const ADMIN_USER_ID = "aaa8656a-e03f-4a6b-aef3-da9448f5cdeb";

// Analytics — both undefined in local dev unless set in .env.local, in
// which case the scripts that read these just don't render.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "";
