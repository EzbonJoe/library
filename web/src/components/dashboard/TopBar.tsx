"use client";

import { useState } from "react";
import { Search, Bell, Plus, Menu } from "lucide-react";
import UserThemeToggle from "./UserThemeToggle";
import Tooltip from "@/components/Tooltip";

export default function TopBar({
  search,
  onSearchChange,
  searchEnabled,
  onOpenAddModal,
  onToggleSidebar,
  displayLetter,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchEnabled: boolean;
  onOpenAddModal: () => void;
  onToggleSidebar: () => void;
  displayLetter: string;
}) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="ud-topbar">
      <Tooltip label="Open menu" position="below">
        <button type="button" className="ud-icon-btn ud-mobile-menu-btn" aria-label="Open menu" onClick={onToggleSidebar}>
          <Menu />
        </button>
      </Tooltip>

      <div className="ud-search-input">
        <Search />
        <input
          type="text"
          placeholder={searchEnabled ? "Search your quotes..." : "Search"}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          disabled={!searchEnabled}
        />
      </div>

      <div className="ud-topbar-right">
        <div style={{ position: "relative" }}>
          <Tooltip label="Notifications" position="below">
            <button
              type="button"
              className="ud-icon-btn"
              aria-label="Notifications"
              onClick={() => setNotifOpen((open) => !open)}
            >
              <Bell />
            </button>
          </Tooltip>
          {notifOpen && <div className="ud-popover">You&apos;re all caught up — no notifications yet.</div>}
        </div>
        <UserThemeToggle />
        <button type="button" className="ud-btn ud-btn-primary ud-btn-sm" onClick={onOpenAddModal}>
          <Plus />
          Add Quote
        </button>
        <div className="ud-avatar">{displayLetter}</div>
      </div>
    </header>
  );
}
