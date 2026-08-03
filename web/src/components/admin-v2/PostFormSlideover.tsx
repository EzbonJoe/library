"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { X } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import RichTextEditor from "./RichTextEditor";
import type { PostRow } from "./BlogPage";

function slugFromTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uploadCoverImage(supabase: SupabaseClient, file: File) {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("covers").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}

export default function PostFormSlideover({
  supabase,
  isOpen,
  editingPost,
  onClose,
  onSaved,
}: {
  supabase: SupabaseClient;
  isOpen: boolean;
  editingPost: PostRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [file, setFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(editingPost);

  // Same during-render sync pattern as BookFormSlideover: fields must be
  // correct in the commit the slide-over opens, not one render later.
  const openKey = isOpen ? `${editingPost?.id ?? "new"}` : "closed";
  const [lastOpenKey, setLastOpenKey] = useState(openKey);
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (isOpen) {
      setTitle(editingPost?.title ?? "");
      setSlug(editingPost?.slug ?? "");
      setExcerpt(editingPost?.excerpt ?? "");
      setContent(editingPost?.content ?? "");
      setSeoTitle(editingPost?.seo_title ?? "");
      setSeoDescription(editingPost?.seo_description ?? "");
      setStatus((editingPost?.status as "draft" | "published") ?? "draft");
      setExistingImage(editingPost?.cover_image_url ?? null);
      setFile(null);
      setError("");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Content is required.");
      return;
    }

    setSaving(true);

    let coverImageUrl = existingImage;
    if (file) {
      try {
        coverImageUrl = await uploadCoverImage(supabase, file);
      } catch (uploadError) {
        setSaving(false);
        setError(uploadError instanceof Error ? uploadError.message : "Cover upload failed.");
        return;
      }
    }

    const payload = {
      title,
      excerpt: excerpt.trim() || null,
      content,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      status,
      cover_image_url: coverImageUrl,
      // Only stamp published_at the first time a post goes live -- flipping
      // it back to draft and republishing later shouldn't reset the date.
      ...(status === "published" && !editingPost?.published_at ? { published_at: new Date().toISOString() } : {}),
    };

    const { error: saveError } = isEditing
      ? await supabase.from("posts").update(payload).eq("id", editingPost!.id)
      : await supabase.from("posts").insert({ ...payload, slug: slug.trim() || slugFromTitle(title) });

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <>
      <div className={`av-slideover-backdrop ${isOpen ? "is-open" : ""}`} onClick={onClose} />
      <div className={`av-slideover ${isOpen ? "is-open" : ""}`} role="dialog" aria-modal="true">
        <div className="av-slideover-header">
          <div className="av-slideover-title">{isEditing ? "Edit Post" : "New Post"}</div>
          <Tooltip label="Close">
            <button type="button" className="av-icon-btn" onClick={onClose} aria-label="Close">
              <X />
            </button>
          </Tooltip>
        </div>

        <form id="post-form" onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className="av-slideover-body">
            <div className="av-slideover-form">
              <div className="av-field">
                <label className="av-field-label">Title</label>
                <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              {!isEditing && (
                <div className="av-field">
                  <label className="av-field-label">Slug (leave blank to generate from the title)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder={title.trim() ? slugFromTitle(title) : "my-post-title"}
                  />
                </div>
              )}
              <div className="av-field">
                <label className="av-field-label">Excerpt</label>
                <textarea rows={2} value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
              </div>
              <div className="av-field">
                <label className="av-field-label">Cover image</label>
                <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </div>
              <div className="av-field">
                <label className="av-field-label">Content</label>
                <RichTextEditor value={content} onChange={setContent} />
              </div>
              <div className="av-field">
                <label className="av-field-label">SEO title (optional, falls back to title)</label>
                <input type="text" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
              </div>
              <div className="av-field">
                <label className="av-field-label">SEO description (optional, falls back to excerpt)</label>
                <textarea rows={2} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
              </div>
              <div className="av-field">
                <label className="av-field-label">Status</label>
                <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              {error && <p style={{ color: "var(--av-danger)", fontSize: "1.2rem" }}>{error}</p>}
            </div>
          </div>

          <div className="av-slideover-footer">
            <button type="button" className="av-btn av-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="av-btn av-btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
