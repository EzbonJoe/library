"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Download, AlertTriangle } from "lucide-react";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { isUsernameTaken, updateProfile, buildAccountExport, downloadAccountPdf } from "@/lib/accountSettings";
import type { Profile } from "@/lib/profile";

export default function SettingsSection({
  supabase,
  user,
  profile,
  onProfileUpdated,
}: {
  supabase: SupabaseClient;
  user: User;
  profile: Profile | null;
  onProfileUpdated: (profile: Profile) => void;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);

    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setError("Username must be 3-30 characters: lowercase letters, numbers, - or _ only.");
      return;
    }

    setSaving(true);
    if (normalized !== profile?.username && (await isUsernameTaken(supabase, normalized, user.id))) {
      setSaving(false);
      setError("That username is already taken.");
      return;
    }

    try {
      await updateProfile(supabase, user.id, { username: normalized, display_name: displayName.trim() || null });
      onProfileUpdated({ id: user.id, username: normalized, display_name: displayName.trim() || null, bio: profile?.bio ?? null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Couldn't save changes. Please try again.");
    }
    setSaving(false);
  }

  async function handleExport() {
    setExporting(true);
    const data = await buildAccountExport(supabase, user.id);
    await downloadAccountPdf(`gadzeke-export-${new Date().toISOString().slice(0, 10)}.pdf`, data);
    setExporting(false);
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    if (confirmText.trim().toUpperCase() !== "DELETE") return;

    setDeleting(true);
    const { error: rpcError } = await supabase.rpc("delete_own_account");
    if (rpcError) {
      setDeleting(false);
      setDeleteError("Couldn't delete your account. Please try again or contact support.");
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="ud-settings">
      <section className="ud-settings-section">
        <h2 className="ud-settings-section-title">Profile</h2>
        <form onSubmit={handleSaveProfile}>
          <div className="ud-field">
            <label className="ud-field-label" htmlFor="settings-username">
              Username
            </label>
            <input
              id="settings-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="ud-field">
            <label className="ud-field-label" htmlFor="settings-display-name">
              Display name
            </label>
            <input
              id="settings-display-name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <div className="ud-field">
            <label className="ud-field-label">Email</label>
            <input type="text" value={user.email ?? ""} disabled />
          </div>
          {error && <p style={{ color: "var(--ud-danger)", fontSize: "1.2rem" }}>{error}</p>}
          <button type="submit" className="ud-btn ud-btn-primary ud-btn-sm" disabled={saving}>
            {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
          </button>
        </form>
      </section>

      <section className="ud-settings-section">
        <h2 className="ud-settings-section-title">Appearance</h2>
        <p className="ud-settings-note">Dark/light mode is available from the icon in the top bar.</p>
      </section>

      <section className="ud-settings-section">
        <h2 className="ud-settings-section-title">Export your data</h2>
        <p className="ud-settings-note">
          Download everything you&apos;ve stored — your quotes, saved quotes, and collections — as a readable PDF.
        </p>
        <button type="button" className="ud-btn ud-btn-secondary ud-btn-sm" onClick={handleExport} disabled={exporting}>
          <Download size={16} />
          {exporting ? "Preparing..." : "Download my data (PDF)"}
        </button>
      </section>

      <section className="ud-settings-section ud-settings-danger">
        <h2 className="ud-settings-section-title">
          <AlertTriangle size={18} />
          Danger zone
        </h2>
        <p className="ud-settings-note">
          Deleting your account permanently removes your quotes, saved quotes, and collections. This can&apos;t be
          undone.
        </p>
        <div className="ud-field" style={{ maxWidth: 320 }}>
          <label className="ud-field-label" htmlFor="settings-delete-confirm">
            Type DELETE to confirm
          </label>
          <input
            id="settings-delete-confirm"
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="DELETE"
          />
        </div>
        {deleteError && <p style={{ color: "var(--ud-danger)", fontSize: "1.2rem" }}>{deleteError}</p>}
        <button
          type="button"
          className="ud-btn ud-btn-danger ud-btn-sm"
          onClick={handleDeleteAccount}
          disabled={confirmText.trim().toUpperCase() !== "DELETE" || deleting}
        >
          {deleting ? "Deleting..." : "Delete my account"}
        </button>
      </section>
    </div>
  );
}
