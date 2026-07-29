"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Bell, Menu, X } from "lucide-react";
import UserThemeToggle from "./UserThemeToggle";
import Tooltip from "@/components/Tooltip";

export default function TopBar({
  search,
  onSearchChange,
  searchEnabled,
  onToggleSidebar,
  displayLetter,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchEnabled: boolean;
  onToggleSidebar: () => void;
  displayLetter: string;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const overlayInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  // Mirrors admin's CommandPalette: Escape closes, and the input is
  // focused the moment the overlay mounts rather than requiring a second tap.
  useEffect(() => {
    if (!searchOpen) return;
    requestAnimationFrame(() => overlayInputRef.current?.focus());
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [searchOpen]);

  return (
    <>
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
        {/* Below 640px .ud-search-input above is hidden by CSS and this
            icon-only button takes its place -- same collapsed shape as
            admin's .av-search-trigger on mobile, opening an overlay
            instead of expanding in place. Grouped with the other icon
            buttons on the right rather than sitting on its own, so it
            doesn't land dead-center between the menu button and this
            group. */}
        <Tooltip label="Search" position="below">
          <button
            type="button"
            className="ud-icon-btn ud-search-mobile-trigger"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search />
          </button>
        </Tooltip>
        <div style={{ position: "relative" }} ref={notifRef}>
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
        <div className="ud-avatar">{displayLetter}</div>
      </div>
    </header>

    {/* Rendered as a sibling of <header>, not a descendant -- .ud-topbar's
        backdrop-filter creates a containing block for fixed-position
        descendants, which would otherwise confine this overlay to the
        topbar's own box instead of the full viewport. */}
    <div className={`ud-search-overlay-backdrop ${searchOpen ? "is-open" : ""}`} onClick={() => setSearchOpen(false)} />
    <div className={`ud-search-overlay ${searchOpen ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Search">
      <div className="ud-search-overlay-input-row">
        <Search />
        <input
          ref={overlayInputRef}
          type="text"
          placeholder={searchEnabled ? "Search your quotes..." : "Search"}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          disabled={!searchEnabled}
        />
        <button type="button" className="ud-search-overlay-close" aria-label="Close search" onClick={() => setSearchOpen(false)}>
          <X />
        </button>
      </div>
    </div>
    </>
  );
}
