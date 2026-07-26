"use client";

import { Sun, Moon } from "lucide-react";
import { useThemeToggle } from "@/hooks/useThemeToggle";

// Same toggle behavior as every other theme toggle in the app, styled as an
// icon+label row to match the admin/dashboard toggles instead of the old
// header pill switch — this one only ever appears inside the mobile
// drop-down menu.
export default function MobileThemeToggle({ onToggled }: { onToggled?: () => void }) {
  const { isDark, toggle } = useThemeToggle();

  function handleClick() {
    toggle();
    onToggled?.();
  }

  return (
    <button type="button" onClick={handleClick}>
      {isDark ? <Sun size={22} /> : <Moon size={22} />}
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
