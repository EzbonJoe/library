"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ensureProfile, type Profile } from "@/lib/profile";
import { loadSavedQuotes, syncLocalBookmarksToAccount, type SavedQuote } from "@/lib/savedQuotes";
import { loadSavedBooks, syncLocalBookBookmarksToAccount, type SavedBook } from "@/lib/savedBooks";
import { loadRecentlyViewed, type RecentlyViewedBook } from "@/lib/recentlyViewed";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Hero from "./Hero";
import StatsGrid from "./StatsGrid";
import MyQuotesGrid, { type MyQuote } from "./MyQuotesGrid";
import SavedQuotesGrid from "./SavedQuotesGrid";
import MyBooksGrid from "./MyBooksGrid";
import CollectionsSection from "./CollectionsSection";
import RecentlyViewedGrid from "./RecentlyViewedGrid";
import SettingsSection from "./SettingsSection";
import AddQuoteModal from "./AddQuoteModal";
import { NAV_ITEMS, type NavKey } from "./nav";
import "@/styles/dashboard.css";

const TAB_STORAGE_KEY = "gadzeke-dashboard-tab";

type HeroQuote = { text: string; book: { title: string; author: string | null } } | null;

async function loadHeroQuote(supabase: ReturnType<typeof createClient>): Promise<HeroQuote> {
  const { count } = await supabase.from("quotes").select("id", { count: "exact", head: true }).eq("editors_pick", true);
  if (!count || count === 0) return null;

  const randomOffset = Math.floor(Math.random() * count);
  const { data } = await supabase
    .from("quotes")
    .select("text, book:books(title, author)")
    .eq("editors_pick", true)
    .order("id")
    .range(randomOffset, randomOffset);

  return (data?.[0] as unknown as HeroQuote) ?? null;
}

export default function UserDashboardApp() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quotes, setQuotes] = useState<MyQuote[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedBook[]>([]);
  const [heroQuote, setHeroQuote] = useState<HeroQuote>(null);
  const [activeTab, setActiveTab] = useState<NavKey>(() => {
    if (typeof window === "undefined") return "overview";
    const stored = localStorage.getItem(TAB_STORAGE_KEY) as NavKey | null;
    // Guards against a stale value from a since-removed tab (e.g. the old
    // "favorites" tab) leaving the content area blank for a returning visitor.
    return stored && NAV_ITEMS.some((item) => item.key === stored) ? stored : "overview";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const overviewResultsRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const hasScrolledForSearchRef = useRef(false);

  // Overview's search results replace the small 3-item "Latest Quotes"
  // preview below the hero and stats -- easy to miss if the user's still
  // scrolled up near the search bar. Scrolls down to them once per typing
  // session (not on every keystroke), and resets so it can fire again the
  // next time they search after clearing it.
  useEffect(() => {
    if (activeTab !== "overview") return;

    if (!search.trim()) {
      hasScrolledForSearchRef.current = false;
      return;
    }

    if (hasScrolledForSearchRef.current) return;
    hasScrolledForSearchRef.current = true;

    const timer = setTimeout(() => {
      overviewResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  function loadQuotes(ownerId: string) {
    supabase
      .from("user_quotes")
      .select("id, text, book_title, created_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setQuotes(data ?? []));
  }

  function loadSaved(ownerId: string) {
    loadSavedQuotes(supabase, ownerId).then(setSavedQuotes);
  }

  function loadBooks(ownerId: string) {
    loadSavedBooks(supabase, ownerId).then(setSavedBooks);
  }

  function loadRecent(ownerId: string) {
    loadRecentlyViewed(supabase, ownerId).then(setRecentlyViewed);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        setProfile(await ensureProfile(supabase, sessionUser));
        loadQuotes(sessionUser.id);
        await syncLocalBookmarksToAccount(supabase, sessionUser.id);
        loadSaved(sessionUser.id);
        await syncLocalBookBookmarksToAccount(supabase, sessionUser.id);
        loadBooks(sessionUser.id);
        loadRecent(sessionUser.id);
      }
    });
    loadHeroQuote(supabase).then(setHeroQuote);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTab(tab: NavKey) {
    setActiveTab(tab);
    setSidebarOpen(false);
    setSearch("");
    localStorage.setItem(TAB_STORAGE_KEY, tab);
    // Without this, switching tabs while scrolled down on the previous one
    // lands the new tab's content at that same scroll position -- its
    // first element (e.g. Collections' "create" row) can end up sitting
    // behind the sticky, frosted-glass top bar: visually blurred through
    // it and unclickable, since the bar sits above it in stacking order.
    // .ud-main is its own scroll container (not the document), so this
    // resets its scroll position directly rather than window.scrollTo.
    mainRef.current?.scrollTo({ top: 0 });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (user === undefined) return null;

  if (!user) {
    return (
      <div
        className="user-dashboard"
        style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 className="ud-hero-greeting" style={{ fontSize: "2.4rem" }}>
            My Library
          </h1>
          <p className="ud-hero-subtext">You need an account to build your personal collection.</p>
          <Link href="/login" className="ud-btn ud-btn-primary" style={{ marginTop: 16 }}>
            Log in
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || user.email?.split("@")[0] || "there";
  const displayLetter = displayName.charAt(0).toUpperCase();
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : "—";
  const savedThisMonth = quotes.filter((quote) => {
    const created = new Date(quote.created_at);
    const now = new Date();
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="user-dashboard">
      <div className="ud-shell">
        <div
          className={`ud-sidebar-backdrop ${sidebarOpen ? "is-open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />
        <Sidebar activeTab={activeTab} onSelectTab={selectTab} onLogout={handleLogout} isOpen={sidebarOpen} />
        <div className="ud-main" ref={mainRef}>
          <TopBar
            search={search}
            onSearchChange={setSearch}
            searchEnabled={
              activeTab === "overview" ||
              activeTab === "my-quotes" ||
              activeTab === "saved" ||
              activeTab === "collections" ||
              activeTab === "my-books" ||
              activeTab === "recent"
            }
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            displayLetter={displayLetter}
          />
          <div className="ud-content">
            {activeTab === "overview" && (
              <>
                <Hero name={displayName} heroQuote={heroQuote} />
                <StatsGrid
                  totalQuotes={quotes.length}
                  savedThisMonth={savedThisMonth}
                  savedQuotesCount={savedQuotes.length}
                  memberSince={memberSince}
                  onSelectTab={selectTab}
                />
                <div className="ud-section-header" ref={overviewResultsRef}>
                  <div className="ud-section-title">{search.trim() ? "My Quotes" : "Latest Quotes"}</div>
                </div>
                {/* Searching here searches every quote, not just the 3-item
                    preview below -- an empty search falls back to that
                    preview since filtering only 3 items would make search
                    look broken (near-certain "no matches" for anything not
                    already in the top 3). */}
                <MyQuotesGrid
                  quotes={search.trim() ? quotes : quotes.slice(0, 3)}
                  supabase={supabase}
                  ownerId={user.id}
                  search={search}
                  onChanged={() => loadQuotes(user.id)}
                />
              </>
            )}

            {activeTab === "my-quotes" && (
              <>
                <div className="ud-section-header">
                  <div className="ud-section-title">My Quotes</div>
                </div>
                <MyQuotesGrid
                  quotes={quotes}
                  supabase={supabase}
                  ownerId={user.id}
                  search={search}
                  onChanged={() => loadQuotes(user.id)}
                />
              </>
            )}

            {activeTab === "saved" && (
              <>
                <div className="ud-section-header">
                  <div className="ud-section-title">Saved Quotes</div>
                </div>
                <SavedQuotesGrid
                  quotes={savedQuotes}
                  supabase={supabase}
                  ownerId={user.id}
                  search={search}
                  onChanged={() => loadSaved(user.id)}
                />
              </>
            )}
            {activeTab === "my-books" && (
              <>
                <div className="ud-section-header">
                  <div className="ud-section-title">My Books</div>
                </div>
                <MyBooksGrid
                  books={savedBooks}
                  supabase={supabase}
                  ownerId={user.id}
                  search={search}
                  onChanged={() => loadBooks(user.id)}
                />
              </>
            )}
            {activeTab === "collections" && (
              <>
                <div className="ud-section-header">
                  <div className="ud-section-title">Collections</div>
                </div>
                <CollectionsSection supabase={supabase} ownerId={user.id} search={search} />
              </>
            )}
            {activeTab === "recent" && (
              <>
                <div className="ud-section-header">
                  <div className="ud-section-title">Recently Viewed</div>
                </div>
                <RecentlyViewedGrid
                  books={recentlyViewed}
                  supabase={supabase}
                  ownerId={user.id}
                  search={search}
                  onChanged={() => loadRecent(user.id)}
                />
              </>
            )}
            {activeTab === "settings" && (
              <>
                <div className="ud-section-header">
                  <div className="ud-section-title">Settings</div>
                </div>
                <SettingsSection supabase={supabase} user={user} profile={profile} onProfileUpdated={setProfile} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* The only Add Quote entry point in this dashboard -- a floating
          action button with its own fixed position, decoupled from the
          topbar's space constraints, shown at every screen size. */}
      <button type="button" className="ud-add-quote-fab" onClick={() => setModalOpen(true)} aria-label="Add a quote">
        <Plus />
      </button>

      <AddQuoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        supabase={supabase}
        ownerId={user.id}
        onSaved={() => loadQuotes(user.id)}
      />
    </div>
  );
}
