"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Subscriber = { id: number; email: string; created_at: string };

export default function SubscribersPanel({ supabase }: { supabase: SupabaseClient }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [copyStatus, setCopyStatus] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    supabase
      .from("subscribers")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setSubscribers(data ?? []));
  }, [supabase, reloadCount]);

  async function handleDelete(id: number) {
    await supabase.from("subscribers").delete().eq("id", id);
    setReloadCount((c) => c + 1);
  }

  async function handleCopyAll() {
    if (subscribers.length === 0) {
      setCopyStatus("No subscribers yet.");
      return;
    }

    await navigator.clipboard.writeText(subscribers.map((s) => s.email).join(", "));
    setCopyStatus(`Copied ${subscribers.length} emails ✓`);
    setTimeout(() => setCopyStatus(""), 2000);
  }

  return (
    <div className="admin-card js-admin-panel" data-tab="subscribers">
      <h2>Subscribers</h2>
      <p className="admin-hint">
        <span>{subscribers.length}</span> people have subscribed so far.
      </p>
      <button type="button" onClick={handleCopyAll}>
        Copy all emails
      </button>
      <p className="status-text">{copyStatus}</p>
      <div className="subscriber-list">
        {subscribers.map((subscriber) => (
          <div key={subscriber.id} className="subscriber-row">
            <span className="subscriber-email">{subscriber.email}</span>
            <button type="button" className="js-delete-subscriber" onClick={() => handleDelete(subscriber.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
