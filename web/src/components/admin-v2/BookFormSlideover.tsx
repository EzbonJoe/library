"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { X } from "lucide-react";
import { resolveCoverUrl } from "@/lib/coverUrl";
import Tooltip from "@/components/Tooltip";
import type { BookRow } from "./BookCard";

const CATEGORIES = [
  "Business",
  "Psychology",
  "Philosophy",
  "Money",
  "Relationships",
  "Leadership",
  "Success",
  "Habits",
  "Spirituality",
  "Productivity",
];

function slugFromTitle(title: string) {
  const cleaned = title.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `Quotes-From-${cleaned}`;
}

async function uploadCoverImage(supabase: SupabaseClient, file: File) {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("covers").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}

export default function BookFormSlideover({
  supabase,
  isOpen,
  editingBook,
  onClose,
  onSaved,
}: {
  supabase: SupabaseClient;
  isOpen: boolean;
  editingBook: BookRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"published" | "coming_soon">("published");
  const [featured, setFeatured] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const isEditing = Boolean(editingBook);

  // Managing an external resource's lifecycle (create on file change, revoke
  // on cleanup) — can't be derived during render, it's the documented
  // "synchronize with an external system" effect shape.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // "Adjusting state when a prop changes" — done during render instead of
  // an effect, so the form fields are correct in the same commit the
  // slide-over opens (or switches which book it's editing), not one render
  // later.
  const openKey = isOpen ? `${editingBook?.id ?? "new"}` : "closed";
  const [lastOpenKey, setLastOpenKey] = useState(openKey);
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (isOpen) {
      setTitle(editingBook?.title ?? "");
      setAuthor(editingBook?.author ?? "");
      setCategory(editingBook?.category ?? "");
      setSlug(editingBook?.slug ?? "");
      setDescription(editingBook?.description ?? "");
      setStatus((editingBook?.status as "published" | "coming_soon") ?? "published");
      setFeatured(editingBook?.featured ?? false);
      setExistingImage(editingBook?.image ? resolveCoverUrl(editingBook.image) : null);
      setFile(null);
      setError("");
    }
  }

  const previewSlug = isEditing ? (editingBook?.slug ?? "") : slug.trim() || (title.trim() ? slugFromTitle(title) : "");
  const previewImage = filePreviewUrl ?? existingImage;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!isEditing && !file) {
      setError("A cover image is required.");
      return;
    }

    setSaving(true);

    let image = existingImage;
    if (file) {
      try {
        image = await uploadCoverImage(supabase, file);
      } catch (uploadError) {
        setSaving(false);
        setError(uploadError instanceof Error ? uploadError.message : "Cover upload failed.");
        return;
      }
    }

    const payload = {
      title,
      author: author.trim() || null,
      category: category || null,
      description: description.trim() || null,
      status,
      featured,
      ...(image ? { image } : {}),
    };

    const { error: saveError } = isEditing
      ? await supabase.from("books").update(payload).eq("id", editingBook!.id)
      : await supabase.from("books").insert({ ...payload, slug: slug.trim() || slugFromTitle(title) });

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
          <div className="av-slideover-title">{isEditing ? "Edit Book" : "Add Book"}</div>
          <Tooltip label="Close">
            <button type="button" className="av-icon-btn" onClick={onClose} aria-label="Close">
              <X />
            </button>
          </Tooltip>
        </div>

        <form id="book-form" onSubmit={handleSubmit} style={{ display: "contents" }}>
          <div className="av-slideover-body">
            <div className="av-slideover-form">
              <div className="av-field">
                <label className="av-field-label">Title</label>
                <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className="av-field-row">
                <div className="av-field">
                  <label className="av-field-label">Author</label>
                  <input type="text" value={author} onChange={(event) => setAuthor(event.target.value)} />
                </div>
                <div className="av-field">
                  <label className="av-field-label">Category</label>
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    <option value="">— none —</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="av-field">
                <label className="av-field-label">Description</label>
                <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              {!isEditing && (
                <div className="av-field">
                  <label className="av-field-label">Slug (leave blank to generate from the title)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder={title.trim() ? slugFromTitle(title) : "Quotes-From-My-Book"}
                  />
                </div>
              )}
              <div className="av-field">
                <label className="av-field-label">{isEditing ? "Replace cover (optional)" : "Cover image"}</label>
                <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </div>
              <div className="av-field-row">
                <div className="av-field">
                  <label className="av-field-label">Status</label>
                  <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                    <option value="published">Published</option>
                    <option value="coming_soon">Coming soon</option>
                  </select>
                </div>
                <div className="av-field" style={{ justifyContent: "center" }}>
                  <label className="av-toggle-row">
                    <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
                    Feature on the Books page
                  </label>
                </div>
              </div>
              {error && <p style={{ color: "var(--av-danger)", fontSize: "1.2rem" }}>{error}</p>}
            </div>

            <div className="av-slideover-preview">
              <div className="av-preview-label">Live Preview</div>
              <div className="av-preview-book-cover">
                {previewImage && (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL or remote Supabase storage URL
                  <img src={previewImage} alt="" />
                )}
              </div>
              <div className="av-preview-book-title">{title || "Book title"}</div>
              <div className="av-preview-book-author">{author || "Author name"}</div>

              <div className="av-preview-slug">
                URL: <code>/book/{previewSlug || "…"}</code>
              </div>

              <div className="av-preview-seo">
                <div className="av-preview-seo-title">
                  {title ? `${title} Quotes${author ? ` by ${author}` : ""} | GadZeke` : "Book Quotes | GadZeke"}
                </div>
                <div className="av-preview-seo-url">gadzeke.com/book/{previewSlug || "…"}</div>
                <div style={{ fontSize: "1.15rem", color: "var(--av-text-muted)", marginTop: 4 }}>
                  {description
                    ? description.slice(0, 140)
                    : `Hand-picked quotes from ${title || "this book"}${category ? ` on ${category}` : ""} — curated by GadZeke, not AI-generated.`}
                </div>
              </div>
            </div>
          </div>

          <div className="av-slideover-footer">
            <button type="button" className="av-btn av-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="av-btn av-btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
