"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BarChart3, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/Turnstile";
import { TURNSTILE_SITE_KEY } from "@/lib/config";
import Sidebar from "@/components/admin-v2/Sidebar";
import TopBar from "@/components/admin-v2/TopBar";
import CommandPalette from "@/components/admin-v2/CommandPalette";
import DashboardPage from "@/components/admin-v2/DashboardPage";
import BooksPage from "@/components/admin-v2/BooksPage";
import AuthorsPage from "@/components/admin-v2/AuthorsPage";
import CategoriesPage from "@/components/admin-v2/CategoriesPage";
import FeaturedPage from "@/components/admin-v2/FeaturedPage";
import ComingSoonPage from "@/components/admin-v2/ComingSoonPage";
import { QUICK_ADD_BOOK_EVENT } from "@/components/admin-v2/QuickAdd";
import type { NavKey } from "@/components/admin-v2/nav";
import AddQuotesPanel from "./AddQuotesPanel";
import ManageQuotesPanel from "./ManageQuotesPanel";
import SubscribersPanel from "./SubscribersPanel";
import "@/styles/admin-v2.css";
import "@/styles/legacy/admin.css";

const ADMIN_TAB_STORAGE_KEY = "gadzeke-admin-tab-v2";
const VALID_TABS: NavKey[] = [
  "dashboard",
  "books",
  "quotes",
  "authors",
  "categories",
  "featured",
  "subscribers",
  "analytics",
  "settings",
];

export default function AdminApp() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<NavKey>(() => {
    if (typeof window === "undefined") return "dashboard";
    const stored = localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
    return stored && VALID_TABS.includes(stored as NavKey) ? (stored as NavKey) : "dashboard";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoOpenAddBook, setAutoOpenAddBook] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleQuickAddBook() {
      setActiveTab("books");
      localStorage.setItem(ADMIN_TAB_STORAGE_KEY, "books");
      setAutoOpenAddBook(true);
    }
    window.addEventListener(QUICK_ADD_BOOK_EVENT, handleQuickAddBook);
    return () => window.removeEventListener(QUICK_ADD_BOOK_EVENT, handleQuickAddBook);
  }, []);

  function selectTab(tab: NavKey) {
    setActiveTab(tab);
    setSidebarOpen(false);
    // Otherwise a stale "true" from an earlier quick-add would re-open the
    // slide-over the next time the Books tab is mounted via plain nav.
    setAutoOpenAddBook(false);
    localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    if (error) setLoginError(error.message);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (!user) {
    return (
      <div className="admin-v2" style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div className="av-card" style={{ width: "min(380px, 90vw)", padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div className="av-brand-mark">G</div>
            <div>
              <div className="av-brand-name">GadZeke Admin</div>
              <div className="av-brand-subtitle">Digital Library CMS</div>
            </div>
          </div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="av-field">
              <label className="av-field-label">Email</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="av-field">
              <label className="av-field-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setCaptchaToken} />
            <button type="submit" className="av-btn av-btn-primary" disabled={!captchaToken}>
              Log in
            </button>
          </form>
          {loginError && <p style={{ color: "var(--av-danger)", fontSize: "1.2rem", marginTop: 12 }}>{loginError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-v2">
      <div className="av-shell">
        <Sidebar activeTab={activeTab} onSelectTab={selectTab} onLogout={handleLogout} isOpen={sidebarOpen} />
        <div className="av-main">
          <TopBar
            activeTab={activeTab}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            onQuickAddQuote={() => selectTab("quotes")}
          />
          <div className="av-content">
            {activeTab === "dashboard" && (
              <DashboardPage
                supabase={supabase}
                onNavigate={selectTab}
                onQuickAddBook={() => window.dispatchEvent(new CustomEvent(QUICK_ADD_BOOK_EVENT))}
                onQuickAddQuote={() => selectTab("quotes")}
              />
            )}
            {activeTab === "books" && (
              <BooksPage
                supabase={supabase}
                autoOpenAdd={autoOpenAddBook}
                onBooksChanged={() => setRefreshKey((k) => k + 1)}
              />
            )}
            {activeTab === "quotes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <AddQuotesPanel supabase={supabase} refreshKey={refreshKey} />
                <ManageQuotesPanel supabase={supabase} refreshKey={refreshKey} />
              </div>
            )}
            {activeTab === "authors" && <AuthorsPage supabase={supabase} />}
            {activeTab === "categories" && <CategoriesPage supabase={supabase} />}
            {activeTab === "featured" && <FeaturedPage supabase={supabase} />}
            {activeTab === "subscribers" && <SubscribersPanel supabase={supabase} />}
            {activeTab === "analytics" && (
              <ComingSoonPage
                icon={BarChart3}
                title="Analytics coming soon"
                note="No page-view or engagement tracking exists yet — this needs an events pipeline before there's real data to show here."
              />
            )}
            {activeTab === "settings" && (
              <ComingSoonPage
                icon={Settings}
                title="Settings coming soon"
                note="Site-wide settings (site name, social links, SEO defaults) aren't centralized yet — currently hardcoded across the codebase."
              />
            )}
          </div>
        </div>
      </div>
      <CommandPalette supabase={supabase} onNavigate={selectTab} />
    </div>
  );
}
