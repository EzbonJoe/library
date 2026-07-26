"use client";

import { Sun, Moon } from "lucide-react";
import Tooltip from "./Tooltip";
import { useThemeToggle } from "@/hooks/useThemeToggle";

// Public header's icon-button toggle — same underlying behavior as every
// other theme toggle in the app, styled to match the header's other
// icon-btn-header controls (search, bookmarks) instead of the old pill
// switch.
export default function SiteThemeToggle() {
  const { isDark, toggle } = useThemeToggle();

  return (
    <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"} position="below">
      <button
        type="button"
        className="icon-btn-header site-theme-toggle"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </Tooltip>
  );
}
