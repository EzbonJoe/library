"use client";

import Link from "next/link";
import { PenLine, Heart, Tag } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";

// Markets the personal dashboard (My Quotes / Saved Quotes / Collections)
// to logged-out visitors, who currently have no way to discover it exists
// before creating an account — hidden entirely once logged in, since a
// returning user doesn't need to be sold on a feature they already use.
export default function BuildLibrarySection() {
  const { user } = useAuthUser();

  if (user) return null;

  return (
    <section className="build-library">
      <h2 className="build-library-heading">Build your own library</h2>
      <p className="build-library-subtext">
        Write your own quotes, save the ones that stop you mid-scroll, and organize them into
        collections — free, and just for you.
      </p>
      <div className="build-library-cards">
        <div className="build-library-card">
          <PenLine />
          <div className="build-library-card-title">My Quotes</div>
          <p>Jot down the lines you come up with yourself.</p>
        </div>
        <div className="build-library-card">
          <Heart />
          <div className="build-library-card-title">Saved Quotes</div>
          <p>Star a quote here and it follows you to every device.</p>
        </div>
        <div className="build-library-card">
          <Tag />
          <div className="build-library-card-title">Collections</div>
          <p>Group quotes by theme — Money, Mindset, Stoicism, anything.</p>
        </div>
      </div>
      <Link href="/signup" className="build-library-cta">
        Create your free account
      </Link>
    </section>
  );
}
