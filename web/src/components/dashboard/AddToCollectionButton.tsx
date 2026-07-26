"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FolderPlus, Check, Plus } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import {
  type Collection,
  type CollectionItemType,
  loadCollections,
  loadCollectionsForItem,
  createCollection,
  addItemToCollection,
  removeItemFromCollection,
} from "@/lib/collections";

export default function AddToCollectionButton({
  supabase,
  ownerId,
  itemType,
  itemRef,
}: {
  supabase: SupabaseClient;
  ownerId: string;
  itemType: CollectionItemType;
  itemRef: number;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [memberOf, setMemberOf] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    Promise.all([loadCollections(supabase, ownerId), loadCollectionsForItem(supabase, itemType, itemRef)]).then(
      ([cols, memberIds]) => {
        setCollections(cols);
        setMemberOf(new Set(memberIds));
        setLoaded(true);
      },
    );
  }, [open, loaded, supabase, ownerId, itemType, itemRef]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function toggleCollection(collectionId: number) {
    const isMember = memberOf.has(collectionId);
    setMemberOf((prev) => {
      const next = new Set(prev);
      if (isMember) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });
    if (isMember) await removeItemFromCollection(supabase, collectionId, itemType, itemRef);
    else await addItemToCollection(supabase, collectionId, itemType, itemRef);
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, item_count: c.item_count + (isMember ? -1 : 1) } : c)),
    );
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    const created = await createCollection(supabase, ownerId, newName.trim());
    await addItemToCollection(supabase, created.id, itemType, itemRef);
    setCollections((prev) => [{ ...created, item_count: 1 }, ...prev]);
    setMemberOf((prev) => new Set(prev).add(created.id));
    setNewName("");
  }

  return (
    <div style={{ position: "relative" }} ref={wrapRef}>
      <Tooltip label="Add to collection">
        <button
          type="button"
          className="ud-quote-card-action"
          aria-label="Add to collection"
          onClick={() => setOpen((o) => !o)}
        >
          <FolderPlus />
        </button>
      </Tooltip>
      {open && (
        <div className="ud-popover ud-collection-popover">
          {loaded && collections.length === 0 && <p style={{ marginBottom: 8 }}>No collections yet.</p>}
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className="ud-collection-option"
              onClick={() => toggleCollection(collection.id)}
            >
              <span>{collection.name}</span>
              {memberOf.has(collection.id) && <Check size={14} />}
            </button>
          ))}
          <form onSubmit={handleCreate} className="ud-collection-new-form">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="New collection..."
            />
            <button type="submit" aria-label="Create collection" disabled={!newName.trim()}>
              <Plus size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
