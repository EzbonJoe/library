"use client";

import { Sun, Moon } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import { useThemeToggle } from "@/hooks/useThemeToggle";

// Same toggle behavior as every other theme toggle in the app, styled to
// match this dashboard's icon buttons.
export default function UserThemeToggle() {
  const { isDark, toggle } = useThemeToggle();

  return (
    <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"} position="below">
      <button
        type="button"
        className="ud-icon-btn"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun /> : <Moon />}
      </button>
    </Tooltip>
  );
}
