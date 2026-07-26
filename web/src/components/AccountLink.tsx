"use client";

import Link from "next/link";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function AccountLink({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const { user, username } = useAuthUser();

  if (user === undefined) return null;

  if (!user) {
    return (
      <Link href="/login" className={className} onClick={onNavigate}>
        Log in
      </Link>
    );
  }

  return (
    <Link href="/my-quotes" className={className} onClick={onNavigate}>
      {username ? `@${username}` : "My quotes"}
    </Link>
  );
}
