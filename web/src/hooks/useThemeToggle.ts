"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "display-color";

function applyTheme(isDark: boolean) {
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  // Legacy vars kept until every stylesheet migrates off these.
  document.documentElement.style.setProperty("--site-background-color", isDark ? "#131720" : "aliceblue");
  document.documentElement.style.setProperty("--site-color", isDark ? "white" : "black");
}

// Shared by every theme toggle in the app (public header, mobile menu,
// admin, user dashboard) — one source of truth for both the toggling
// behavior and, just as importantly, how it avoids a hydration mismatch.
//
// These toggles swap between two entirely different icon components
// (Sun/Moon), not just a boolean attribute on one element — reading real
// theme state during the initial render would mismatch the server's output
// (which has no access to localStorage/data-theme) for any visitor who's
// actually chosen dark mode, and React would need to re-render to fix it.
// So every toggle starts "light" on both server and first client render
// (matching each other, no mismatch possible), then syncs to the real
// value immediately after mount — the flash is imperceptible, and it's the
// same trick already proven out in MobileThemeToggle.
export function useThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return { isDark, toggle };
}
