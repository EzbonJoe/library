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
    <aside className={`av-sidebar ${isOpen ? "is-open" : ""}`}>
      <div className="av-brand">
        <div className="av-brand-mark">G</div>
        <div>
          <div className="av-brand-name">GadZeke Admin</div>
          <div className="av-brand-subtitle">Digital Library CMS</div>
        </div>
      </div>

      <nav className="av-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={`av-nav-link ${activeTab === item.key ? "is-active" : ""}`}
              onClick={() => onSelectTab(item.key)}
            >
              <Icon />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="av-sidebar-footer">
        <Link href="/" className="av-nav-link">
          <ArrowLeft />
          View Website
        </Link>
        <button type="button" className="av-nav-link" onClick={onLogout}>
          <LogOut />
          Log out
        </button>
      </div>
    </aside>
  );
}
