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

// Analytics — both undefined in local dev unless set in .env.local, in
// which case the scripts that read these just don't render.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "";
