import { createClient } from "@/lib/supabase/public";

export type SiteSettings = {
  siteName: string;
  siteTagline: string;
  seoDescription: string;
  ogImageUrl: string;
  footerCuratorText: string;
  footerCopyrightText: string;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  facebookUrl: string | null;
};

// Mirrors the column defaults in supabase/migration-018-settings.sql -- used
// whenever the settings row hasn't been created yet (fresh DB, migration
// not run) so the site still renders instead of showing blank chrome.
const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "GadZeke",
  siteTagline: "Words That Change Perspectives",
  seoDescription:
    "Discover timeless, hand-picked quotes from the world's greatest business, psychology, and philosophy books — curated by GadZeke, not AI-generated.",
  ogImageUrl: "/icons/logo-social.png",
  footerCuratorText: "Hand-picked by Rami Zeke, one book at a time — not AI-generated.",
  footerCopyrightText:
    "© 2026 GadZeke — quotes are excerpted from their original books for personal inspiration and commentary.",
  youtubeUrl: "https://www.youtube.com/@RamiZeke",
  instagramUrl: "https://instagram.com/gadzeke",
  twitterUrl: null,
  facebookUrl: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = createClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  if (!data) return DEFAULT_SETTINGS;

  return {
    siteName: data.site_name,
    siteTagline: data.site_tagline,
    seoDescription: data.seo_description,
    ogImageUrl: data.og_image_url,
    footerCuratorText: data.footer_curator_text,
    footerCopyrightText: data.footer_copyright_text,
    youtubeUrl: data.youtube_url,
    instagramUrl: data.instagram_url,
    twitterUrl: data.twitter_url,
    facebookUrl: data.facebook_url,
  };
}
