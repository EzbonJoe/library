"use client";

import { Sun, Moon } from "lucide-react";
import { useThemeToggle } from "@/hooks/useThemeToggle";

// Same toggle behavior as every other theme toggle in the app, styled to
// match the admin sidebar's nav-link rows.
export default function AdminThemeToggle() {
  const { isDark, toggle } = useThemeToggle();

  return (
    <button
      type="button"
      className="av-nav-link"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun /> : <Moon />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
