"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Plus, Newspaper, Pencil, Trash2, ExternalLink } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import EmptyState from "./EmptyState";
import PostFormSlideover from "./PostFormSlideover";

export type PostRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
};

async function fetchPosts(supabase: SupabaseClient): Promise<PostRow[]> {
  const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  return (data ?? []) as PostRow[];
}

export default function BlogPage({ supabase }: { supabase: SupabaseClient }) {
  const [posts, setPosts] = useState<PostRow[] | null>(null);
  const [slideoverOpen, setSlideoverOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostRow | null>(null);

  const reload = useCallback(async () => {
    setPosts(await fetchPosts(supabase));
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    fetchPosts(supabase).then((rows) => {
      if (!cancelled) setPosts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await supabase.from("posts").delete().eq("id", id);
    reload();
  }

  function openEdit(post: PostRow) {
    setEditingPost(post);
    setSlideoverOpen(true);
  }

  function openAdd() {
    setEditingPost(null);
    setSlideoverOpen(true);
  }

  return (
    <div>
      <div className="av-toolbar">
        <button type="button" className="av-btn av-btn-primary" onClick={openAdd} style={{ marginLeft: "auto" }}>
          <Plus />
          New Post
        </button>
      </div>

      {posts === null ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="av-skeleton" style={{ height: 56 }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No posts yet." actionLabel="Write First Post" onAction={openAdd} />
      ) : (
        <div className="av-table-wrap">
          <table className="av-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>
                    <span className={`av-badge ${post.status === "published" ? "av-badge-accent" : ""}`}>
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      {post.status === "published" && (
                        <Tooltip label="View live">
                          <a
                            className="av-icon-btn"
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="View live"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </Tooltip>
                      )}
                      <Tooltip label="Edit">
                        <button type="button" className="av-icon-btn" aria-label="Edit" onClick={() => openEdit(post)}>
                          <Pencil size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <button
                          type="button"
                          className="av-icon-btn"
                          aria-label="Delete"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PostFormSlideover
        supabase={supabase}
        isOpen={slideoverOpen}
        editingPost={editingPost}
        onClose={() => setSlideoverOpen(false)}
        onSaved={reload}
      />
    </div>
  );
}
