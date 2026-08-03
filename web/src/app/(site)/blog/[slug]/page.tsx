import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/public";
import { postLink } from "@/lib/postLink";
import "@/styles/legacy/blog.css";

export const revalidate = 3600;

type PostRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
};

let allPostsPromise: Promise<PostRow[]> | null = null;

function loadAllPosts() {
  if (!allPostsPromise) {
    allPostsPromise = (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select("slug, title, excerpt, content, cover_image_url, seo_title, seo_description, published_at")
        .eq("status", "published");
      return (data ?? []) as PostRow[];
    })();
  }
  return allPostsPromise;
}

async function getPostBySlug(slug: string): Promise<PostRow | null> {
  const posts = await loadAllPosts();
  return posts.find((p) => p.slug.toLowerCase() === slug.toLowerCase()) ?? null;
}

export async function generateStaticParams() {
  const posts = await loadAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = `${post.seo_title || post.title} | GadZeke`;
  const description = post.seo_description || post.excerpt || undefined;
  const canonicalPath = postLink(post.slug);

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalPath,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const canonicalUrl = `https://gadzeke.com${postLink(post.slug)}`;

  return (
    <main className="feed-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            url: canonicalUrl,
            ...(post.excerpt ? { description: post.excerpt } : {}),
            ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
            ...(post.published_at ? { datePublished: post.published_at } : {}),
          }).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://gadzeke.com/" },
              { "@type": "ListItem", position: 2, name: "Blog", item: "https://gadzeke.com/blog" },
              { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />

      <p className="blog-post-crumb">
        <Link href="/blog">Blog</Link> — {post.title}
      </p>

      {post.cover_image_url && (
        <Image
          src={post.cover_image_url}
          alt=""
          width={1200}
          height={630}
          className="blog-post-cover"
          priority
        />
      )}

      <h1 className="blog-post-title">{post.title}</h1>
      {post.published_at && (
        <p className="blog-post-date">
          {new Date(post.published_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    </main>
  );
}
