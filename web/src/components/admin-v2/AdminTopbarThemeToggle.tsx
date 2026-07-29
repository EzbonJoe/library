"use client";

import { Sun, Moon } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import { useThemeToggle } from "@/hooks/useThemeToggle";

// AdminThemeToggle.tsx is styled as a full nav-link row for the sidebar
// footer -- on mobile that sidebar sits off-canvas behind the hamburger
// menu, so the theme toggle was unreachable without an extra tap. This is
// the topbar's own icon-only variant, always visible, matching the
// dashboard's UserThemeToggle placement.
export default function AdminTopbarThemeToggle() {
  const { isDark, toggle } = useThemeToggle();

  return (
    <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"} position="below">
      <button
        type="button"
        className="av-icon-btn"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun /> : <Moon />}
      </button>
    </Tooltip>
  );
}
