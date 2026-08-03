import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/public";
import { postLink } from "@/lib/postLink";
import "@/styles/legacy/blog.css";

export const revalidate = 3600;

const description =
  "Essays and reading guides from GadZeke — hand-picked quotes, book breakdowns, and ideas worth sitting with.";

export const metadata: Metadata = {
  title: "Blog | GadZeke",
  description,
  alternates: { canonical: "/blog" },
  openGraph: { title: "Blog | GadZeke", description, url: "/blog", type: "website" },
};

type PostRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

export default async function BlogPage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, title, excerpt, cover_image_url, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const rows = (posts ?? []) as PostRow[];

  return (
    <main className="feed-main">
      <div className="blog-header">
        <h1 className="blog-title">Blog</h1>
        <p className="blog-subtitle">{description}</p>
      </div>

      {rows.length === 0 ? (
        <p className="blog-empty">No posts yet — check back soon.</p>
      ) : (
        <div className="blog-grid">
          {rows.map((post) => (
            <Link key={post.slug} href={postLink(post.slug)} className="blog-card">
              {post.cover_image_url && (
                <Image
                  src={post.cover_image_url}
                  alt=""
                  width={640}
                  height={360}
                  className="blog-card-cover"
                />
              )}
              <div className="blog-card-body">
                {post.published_at && (
                  <span className="blog-card-date">
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
                <h2 className="blog-card-title">{post.title}</h2>
                {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
