"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type SettingsRow = {
  site_name: string;
  site_tagline: string;
  seo_description: string;
  og_image_url: string;
  footer_curator_text: string;
  footer_copyright_text: string;
  youtube_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
};

function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--av-font-display)", fontWeight: 600, fontSize: "1.6rem" }}>{title}</div>
      {note && (
        <p className="av-activity-meta" style={{ marginTop: 4 }}>
          {note}
        </p>
      )}
    </div>
  );
}

export default function SettingsPage({ supabase }: { supabase: SupabaseClient }) {
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => setSettings(data));
  }, [supabase]);

  function updateField<K extends keyof SettingsRow>(key: K, value: SettingsRow[K]) {
    setJustSaved(false);
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase
      .from("settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setJustSaved(true);
  }

  if (settings === null) {
    return (
      <div style={{ display: "grid", gap: 16, maxWidth: 640 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="av-skeleton" style={{ height: 56 }} />
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="av-card"
      style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}
    >
      <SectionHeading
        title="Site"
        note="Used in the header, footer, and page titles across the site."
      />
      <div className="av-field">
        <label className="av-field-label">Site name</label>
        <input
          type="text"
          value={settings.site_name}
          onChange={(event) => updateField("site_name", event.target.value)}
          required
        />
      </div>
      <div className="av-field">
        <label className="av-field-label">Tagline</label>
        <input
          type="text"
          value={settings.site_tagline}
          onChange={(event) => updateField("site_tagline", event.target.value)}
          required
        />
      </div>

      <SectionHeading
        title="SEO defaults"
        note="Fallback meta description and social preview image for pages that don't set their own."
      />
      <div className="av-field">
        <label className="av-field-label">Default meta description</label>
        <textarea
          value={settings.seo_description}
          onChange={(event) => updateField("seo_description", event.target.value)}
          rows={3}
          required
        />
      </div>
      <div className="av-field">
        <label className="av-field-label">Social preview image path</label>
        <input
          type="text"
          value={settings.og_image_url}
          onChange={(event) => updateField("og_image_url", event.target.value)}
          required
        />
      </div>

      <SectionHeading title="Footer" />
      <div className="av-field">
        <label className="av-field-label">Curator line</label>
        <input
          type="text"
          value={settings.footer_curator_text}
          onChange={(event) => updateField("footer_curator_text", event.target.value)}
          required
        />
      </div>
      <div className="av-field">
        <label className="av-field-label">Copyright line</label>
        <input
          type="text"
          value={settings.footer_copyright_text}
          onChange={(event) => updateField("footer_copyright_text", event.target.value)}
          required
        />
      </div>

      <SectionHeading title="Social links" note="Leave a field blank to hide that icon from the footer." />
      <div className="av-field">
        <label className="av-field-label">YouTube URL</label>
        <input
          type="url"
          value={settings.youtube_url ?? ""}
          onChange={(event) => updateField("youtube_url", event.target.value || null)}
        />
      </div>
      <div className="av-field">
        <label className="av-field-label">Instagram URL</label>
        <input
          type="url"
          value={settings.instagram_url ?? ""}
          onChange={(event) => updateField("instagram_url", event.target.value || null)}
        />
      </div>
      <div className="av-field">
        <label className="av-field-label">Twitter / X URL</label>
        <input
          type="url"
          value={settings.twitter_url ?? ""}
          onChange={(event) => updateField("twitter_url", event.target.value || null)}
        />
      </div>
      <div className="av-field">
        <label className="av-field-label">Facebook URL</label>
        <input
          type="url"
          value={settings.facebook_url ?? ""}
          onChange={(event) => updateField("facebook_url", event.target.value || null)}
        />
      </div>

      {error && <p style={{ color: "var(--av-danger)", fontSize: "1.2rem" }}>{error}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="submit" className="av-btn av-btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        {justSaved && !saving && <span className="av-activity-meta">Saved.</span>}
      </div>
    </form>
  );
}
