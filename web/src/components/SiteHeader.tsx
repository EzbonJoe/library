"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteThemeToggle from "./SiteThemeToggle";
import Tooltip from "./Tooltip";
import MobileThemeToggle from "./MobileThemeToggle";
import AccountLink from "./AccountLink";
import { DesktopLogoutButton, MobileLogoutButton } from "./LogoutButton";
import { TOGGLE_SEARCH_EVENT } from "./SearchOverlay";
import { BOOKMARKS_CHANGED_EVENT, getBookmarks } from "@/lib/bookmarks";
import { BOOKMARK_TOGGLE_CLICK_EVENT } from "@/lib/events";
import { useAuthUser } from "@/hooks/useAuthUser";

const NAV_LINKS = [
  { href: "/books", label: "Books" },
  { href: "/blog", label: "Blog", secondary: true },
  { href: "/authors", label: "Authors", secondary: true },
  { href: "/categories", label: "Categories", secondary: true },
];

export default function SiteHeader({ siteName = "GadZeke" }: { siteName?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasBookmarks, setHasBookmarks] = useState(false);
  const pathname = usePathname();
  const { user } = useAuthUser();

  useEffect(() => {
    document.body.classList.toggle("menu-open", isMenuOpen);
  }, [isMenuOpen]);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 16);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function refresh() {
      setHasBookmarks(getBookmarks().length > 0);
    }
    refresh();
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(BOOKMARKS_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  function handleBookmarkIconClick(event: React.MouseEvent) {
    if (pathname === "/") {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent(BOOKMARK_TOGGLE_CLICK_EVENT));
    }
  }

  return (
    <>
      <div
        className={`mobile-menu-backdrop js-mobile-menu-backdrop ${isMenuOpen ? "is-open" : ""}`}
        onClick={() => setIsMenuOpen(false)}
      />
      <nav className={`drop-down js-drop-down ${isMenuOpen ? "is-open" : ""}`}>
        <ul>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/?bookmarked=true" onClick={() => setIsMenuOpen(false)}>
              Bookmarks
            </Link>
          </li>
          <li>
            <Link href="/about" onClick={() => setIsMenuOpen(false)}>
              About
            </Link>
          </li>
          <li>
            <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
              Contact
            </Link>
          </li>
          <li>
            <AccountLink onNavigate={() => setIsMenuOpen(false)} />
          </li>
          {user && (
            <li>
              <MobileLogoutButton onLoggedOut={() => setIsMenuOpen(false)} />
            </li>
          )}
          <li>
            <MobileThemeToggle onToggled={() => setIsMenuOpen(false)} />
          </li>
        </ul>
        <Link href="/#feed" className="drop-down-cta" onClick={() => setIsMenuOpen(false)}>
          Explore Quotes
        </Link>
      </nav>

      <header className={`header ${isScrolled ? "header--scrolled" : ""}`}>
        <div className="header-inner">
          <div className="left-section">
            <Link href="/" className="brand-link">
              <Image src="/icons/logo-mark.png" alt="" width={32} height={32} className="brand-logo" priority />
              <div className="page-name">{siteName}</div>
            </Link>
            <nav>
              <ul>
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className={link.secondary ? "nav-secondary" : undefined}>
                    <li>{link.label}</li>
                  </Link>
                ))}
              </ul>
            </nav>
          </div>

          <div className="right-section">
            <Tooltip label="Search (Ctrl+K)" position="below">
              <button
                type="button"
                className="icon-btn-header js-search-trigger"
                aria-label="Search (Ctrl+K)"
                onClick={() => window.dispatchEvent(new CustomEvent(TOGGLE_SEARCH_EVENT))}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </Tooltip>
            <Tooltip label="Bookmarks" position="below">
              <Link
                href="/?bookmarked=true"
                className={`icon-btn-header js-bookmark-icon ${hasBookmarks ? "has-bookmarks" : ""}`}
                aria-label="Bookmarks"
                onClick={handleBookmarkIconClick}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                </svg>
              </Link>
            </Tooltip>
            <AccountLink className="account-link" />
            {user && <DesktopLogoutButton />}
            <SiteThemeToggle />
            <Link href="/#feed" className="header-cta">
              Explore Quotes
            </Link>
            <button
              type="button"
              className={`icon-container js-icon-container ${isMenuOpen ? "is-open" : ""}`}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="menu-bar" />
              <span className="menu-bar" />
              <span className="menu-bar" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
