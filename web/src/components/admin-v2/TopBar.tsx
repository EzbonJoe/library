"use client";

import { Search, Menu, Bell } from "lucide-react";
import { TOGGLE_ADMIN_SEARCH_EVENT } from "./CommandPalette";
import QuickAdd from "./QuickAdd";
import { NAV_ITEMS, type NavKey } from "./nav";
import Tooltip from "@/components/Tooltip";

export default function TopBar({
  activeTab,
  onToggleSidebar,
  onQuickAddQuote,
}: {
  activeTab: NavKey;
  onToggleSidebar: () => void;
  onQuickAddQuote: () => void;
}) {
  const current = NAV_ITEMS.find((item) => item.key === activeTab);

  return (
    <div className="av-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Tooltip label="Toggle menu" position="below">
          <button type="button" className="av-icon-btn av-mobile-menu-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
            <Menu />
          </button>
        </Tooltip>
        <div className="av-topbar-left">
          <span className="av-breadcrumb">Dashboard {current && current.key !== "dashboard" ? `/ ${current.label}` : ""}</span>
          <h1 className="av-page-title">{current?.label ?? "Dashboard"}</h1>
        </div>
      </div>

      <div className="av-topbar-right">
        <button
          type="button"
          className="av-search-trigger"
          onClick={() => window.dispatchEvent(new CustomEvent(TOGGLE_ADMIN_SEARCH_EVENT))}
        >
          <Search />
          Search...
          <kbd>Ctrl K</kbd>
        </button>
        <Tooltip label="Notifications" position="below">
          <button type="button" className="av-icon-btn" aria-label="Notifications">
            <Bell />
          </button>
        </Tooltip>
        <QuickAdd onAddQuote={onQuickAddQuote} />
      </div>
    </div>
  );
}
