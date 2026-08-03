"use client";

import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function AccountLink({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const { user } = useAuthUser();

  if (user === undefined) return null;

  // Logged-out visitors land on /my-quotes's own gate (account pitch + a
  // Log in CTA) rather than being sent straight to /login -- a feature-named
  // link converts better than a bare "Log in", and the destination already
  // handles the auth branching so this component doesn't need to duplicate it.
  return (
    <Link href="/my-quotes" className={className} onClick={onNavigate}>
      My Quotes
    </Link>
  );
}
