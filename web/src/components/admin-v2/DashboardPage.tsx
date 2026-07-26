"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BookOpen, Quote, PenLine, Mail, Plus, ArrowUpRight, Clock } from "lucide-react";
import { resolveCoverUrl } from "@/lib/coverUrl";
import type { NavKey } from "./nav";

type Stats = { books: number; quotes: number; authors: number; subscribers: number };
type RecentQuote = { id: number; text: string; created_at: string; books: { title: string; image: string } | null };
type RecentBook = { id: number; title: string; author: string | null; image: string; created_at: string; status: string };
type RecentSubscriber = { id: number; email: string; created_at: string };

export default function DashboardPage({
  supabase,
  onNavigate,
  onQuickAddBook,
  onQuickAddQuote,
}: {
  supabase: SupabaseClient;
  onNavigate: (tab: NavKey) => void;
  onQuickAddBook: () => void;
  onQuickAddQuote: () => void;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);
  const [recentBooks, setRecentBooks] = useState<RecentBook[]>([]);
  const [recentSubscribers, setRecentSubscribers] = useState<RecentSubscriber[]>([]);
  const [comingSoon, setComingSoon] = useState<RecentBook[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [booksCount, quotesCount, authorRows, subscribersCount, quotesRecent, booksRecent, subscribersRecent, comingSoonBooks] =
        await Promise.all([
          supabase.from("books").select("id", { count: "exact", head: true }),
          supabase.from("quotes").select("id", { count: "exact", head: true }),
          supabase.from("books").select("author").not("author", "is", null),
          supabase.from("subscribers").select("id", { count: "exact", head: true }),
          supabase
            .from("quotes")
            .select("id, text, created_at, books(title, image)")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("books")
            .select("id, title, author, image, created_at, status")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase.from("subscribers").select("id, email, created_at").order("created_at", { ascending: false }).limit(5),
          supabase
            .from("books")
            .select("id, title, author, image, created_at, status")
            .eq("status", "coming_soon")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      if (cancelled) return;

      const distinctAuthors = new Set((authorRows.data ?? []).map((b) => b.author)).size;

      setStats({
        books: booksCount.count ?? 0,
        quotes: quotesCount.count ?? 0,
        authors: distinctAuthors,
        subscribers: subscribersCount.count ?? 0,
      });
      setRecentQuotes((quotesRecent.data ?? []) as unknown as RecentQuote[]);
      setRecentBooks((booksRecent.data ?? []) as RecentBook[]);
      setRecentSubscribers(subscribersRecent.data ?? []);
      setComingSoon((comingSoonBooks.data ?? []) as RecentBook[]);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div>
      <div className="av-stat-grid">
        <StatCard icon={BookOpen} label="Books" value={stats?.books} />
        <StatCard icon={Quote} label="Quotes" value={stats?.quotes} />
        <StatCard icon={PenLine} label="Authors" value={stats?.authors} />
        <StatCard icon={Mail} label="Subscribers" value={stats?.subscribers} />
      </div>

      <div className="av-section">
        <div className="av-section-header">
          <div className="av-section-title">Quick Actions</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="av-btn av-btn-primary" onClick={onQuickAddBook}>
            <Plus />
            Add Book
          </button>
          <button type="button" className="av-btn av-btn-secondary" onClick={onQuickAddQuote}>
            <Plus />
            Add Quote
          </button>
          <a href="/" target="_blank" rel="noopener" className="av-btn av-btn-secondary">
            <ArrowUpRight />
            View Website
          </a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        <div className="av-section">
          <div className="av-section-header">
            <div className="av-section-title">Latest Quotes</div>
            <button type="button" className="av-section-link" onClick={() => onNavigate("quotes")}>
              View all
            </button>
          </div>
          <div className="av-card av-activity-list">
            {recentQuotes.length === 0 ? (
              <div className="av-empty" style={{ padding: 24 }}>
                <Clock size={20} />
                <span className="av-activity-meta">No quotes yet.</span>
              </div>
            ) : (
              recentQuotes.map((quote) => (
                <div key={quote.id} className="av-activity-row">
                  {quote.books?.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host
                    <img className="av-activity-thumb" src={resolveCoverUrl(quote.books.image)} alt="" />
                  )}
                  <div className="av-activity-main">
                    <div className="av-activity-title">{quote.text}</div>
                    <div className="av-activity-meta">{quote.books?.title ?? "Unknown book"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="av-section">
          <div className="av-section-header">
            <div className="av-section-title">Newest Books</div>
            <button type="button" className="av-section-link" onClick={() => onNavigate("books")}>
              View all
            </button>
          </div>
          <div className="av-card av-activity-list">
            {recentBooks.length === 0 ? (
              <div className="av-empty" style={{ padding: 24 }}>
                <Clock size={20} />
                <span className="av-activity-meta">No books yet.</span>
              </div>
            ) : (
              recentBooks.map((book) => (
                <div key={book.id} className="av-activity-row">
                  {/* eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host */}
                  <img className="av-activity-thumb" src={resolveCoverUrl(book.image)} alt="" />
                  <div className="av-activity-main">
                    <div className="av-activity-title">{book.title}</div>
                    <div className="av-activity-meta">{book.author ?? "Unknown author"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="av-section">
          <div className="av-section-header">
            <div className="av-section-title">Recent Subscribers</div>
            <button type="button" className="av-section-link" onClick={() => onNavigate("subscribers")}>
              View all
            </button>
          </div>
          <div className="av-card av-activity-list">
            {recentSubscribers.length === 0 ? (
              <div className="av-empty" style={{ padding: 24 }}>
                <Clock size={20} />
                <span className="av-activity-meta">No subscribers yet.</span>
              </div>
            ) : (
              recentSubscribers.map((subscriber) => (
                <div key={subscriber.id} className="av-activity-row">
                  <div className="av-activity-main">
                    <div className="av-activity-title">{subscriber.email}</div>
                    <div className="av-activity-meta">{new Date(subscriber.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="av-section">
          <div className="av-section-header">
            <div className="av-section-title">Coming Soon</div>
            <button type="button" className="av-section-link" onClick={() => onNavigate("books")}>
              View all
            </button>
          </div>
          <div className="av-card av-activity-list">
            {comingSoon.length === 0 ? (
              <div className="av-empty" style={{ padding: 24 }}>
                <Clock size={20} />
                <span className="av-activity-meta">Nothing marked coming soon.</span>
              </div>
            ) : (
              comingSoon.map((book) => (
                <div key={book.id} className="av-activity-row">
                  {/* eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host */}
                  <img className="av-activity-thumb" src={resolveCoverUrl(book.image)} alt="" />
                  <div className="av-activity-main">
                    <div className="av-activity-title">{book.title}</div>
                    <div className="av-activity-meta">{book.author ?? "Unknown author"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number | undefined }) {
  return (
    <div className="av-card av-stat-card">
      <div className="av-stat-label">
        <Icon />
        {label}
      </div>
      <div className="av-stat-value">{value === undefined ? <span className="av-skeleton" style={{ display: "inline-block", width: 48, height: 32 }} /> : value}</div>
    </div>
  );
}
