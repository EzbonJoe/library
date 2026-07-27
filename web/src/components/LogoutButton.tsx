"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Tooltip from "./Tooltip";

export function DesktopLogoutButton() {
  async function handleLogout() {
    await createClient().auth.signOut();
  }

  return (
    <Tooltip label="Log out" position="below">
      <button type="button" className="icon-btn-header desktop-logout-btn" aria-label="Log out" onClick={handleLogout}>
        <LogOut size={18} />
      </button>
    </Tooltip>
  );
}

export function MobileLogoutButton({ onLoggedOut }: { onLoggedOut?: () => void }) {
  async function handleLogout() {
    await createClient().auth.signOut();
    onLoggedOut?.();
  }

  return (
    <button type="button" onClick={handleLogout}>
      <LogOut size={22} />
      Log Out
    </button>
  );
}
