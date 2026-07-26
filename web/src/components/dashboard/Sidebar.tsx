"use client";

import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { NAV_ITEMS, type NavKey } from "./nav";

export default function Sidebar({
  activeTab,
  onSelectTab,
  onLogout,
  isOpen,
}: {
  activeTab: NavKey;
  onSelectTab: (tab: NavKey) => void;
  onLogout: () => void;
  isOpen: boolean;
}) {
  return (
    <aside className={`ud-sidebar ${isOpen ? "is-open" : ""}`}>
      <div className="ud-brand">
        <div className="ud-brand-mark">G</div>
        <div>
          <div className="ud-brand-name">My Library</div>
          <div className="ud-brand-subtitle">GadZeke</div>
        </div>
      </div>

      <nav className="ud-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={`ud-nav-link ${activeTab === item.key ? "is-active" : ""}`}
              onClick={() => onSelectTab(item.key)}
            >
              <Icon />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="ud-sidebar-footer">
        <Link href="/" className="ud-nav-link">
          <ArrowLeft />
          Back to Site
        </Link>
        <button type="button" className="ud-nav-link" onClick={onLogout}>
          <LogOut />
          Log out
        </button>
      </div>
    </aside>
  );
}
