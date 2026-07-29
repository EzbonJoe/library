"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Tag, Plus, Pencil, Trash2, ArrowLeft, ArrowUpRight, Volume2, Pause } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import {
  type Collection,
  type CollectionQuote,
  loadCollections,
  createCollection,
  renameCollection,
  deleteCollection,
  loadCollectionItems,
  removeItemFromCollection,
} from "@/lib/collections";
import { bookLink } from "@/lib/bookLink";
import { resolveCoverUrl } from "@/lib/coverUrl";
import { speakOne, stopSpeaking } from "@/lib/textToSpeech";
import { useSpeechSupported } from "@/hooks/useSpeechSupported";

export default function CollectionsSection({
  supabase,
  ownerId,
  search,
}: {
  supabase: SupabaseClient;
  ownerId: string;
  search: string;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [items, setItems] = useState<CollectionQuote[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const speechSupported = useSpeechSupported();

  function itemKey(item: CollectionQuote) {
    return `${item.itemType}-${item.itemRef}`;
  }

  function handleListen(item: CollectionQuote) {
    const key = itemKey(item);
    const wasPlaying = playingKey === key;
    stopSpeaking();
    setPlayingKey(null);
    if (wasPlaying) return;

    setPlayingKey(key);
    speakOne(item.text, { onEnd: () => setPlayingKey(null) });
  }

  function refreshCollections() {
    loadCollections(supabase, ownerId).then((cols) => {
      setCollections(cols);
      setLoading(false);
    });
  }

  useEffect(() => {
    refreshCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCollection(id: number) {
    setActiveId(id);
    setItemsLoading(true);
    loadCollectionItems(supabase, id).then((rows) => {
      setItems(rows);
      setItemsLoading(false);
    });
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    await createCollection(supabase, ownerId, newName.trim());
    setNewName("");
    refreshCollections();
  }

  async function handleDelete(id: number) {
    if (
      !confirm("Delete this collection? Items inside stay saved elsewhere — only the collection itself is removed.")
    )
      return;
    await deleteCollection(supabase, id);
    if (activeId === id) setActiveId(null);
    refreshCollections();
  }

  function startRename(collection: Collection) {
    setRenamingId(collection.id);
    setRenameValue(collection.name);
  }

  async function saveRename(id: number) {
    if (renameValue.trim()) await renameCollection(supabase, id, renameValue);
    setRenamingId(null);
    refreshCollections();
  }

  async function handleRemoveItem(item: CollectionQuote) {
    if (activeId === null) return;
    await removeItemFromCollection(supabase, activeId, item.itemType, item.itemRef);
    setItems((prev) => prev.filter((i) => !(i.itemType === item.itemType && i.itemRef === item.itemRef)));
    refreshCollections();
  }

  const activeCollection = collections.find((c) => c.id === activeId) ?? null;

  const filteredItems = search.trim()
    ? items.filter(
        (item) =>
          item.text.toLowerCase().includes(search.trim().toLowerCase()) ||
          (item.bookTitle ?? "").toLowerCase().includes(search.trim().toLowerCase()),
      )
    : items;

  const filteredCollections = search.trim()
    ? collections.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))
    : collections;

  if (loading) return null;

  if (activeId !== null) {
    return (
      <div>
        <button
          type="button"
          className="ud-btn ud-btn-secondary ud-btn-sm"
          onClick={() => setActiveId(null)}
          style={{ marginBottom: 16 }}
        >
          <ArrowLeft size={16} />
          Back to Collections
        </button>
        <div className="ud-section-header">
          <div className="ud-section-title">{activeCollection?.name ?? "Collection"}</div>
        </div>

        {itemsLoading ? null : filteredItems.length === 0 ? (
          <div className="ud-empty">
            <div className="ud-empty-icon">
              <Tag />
            </div>
            <div className="ud-empty-title">{search.trim() ? "No matches" : "Nothing here yet"}</div>
            <p>
              {search.trim()
                ? `Nothing in this collection matches "${search}".`
                : "Use the folder icon on any quote in My Quotes or Saved Quotes to add it here."}
            </p>
          </div>
        ) : (
          <div className="ud-quote-grid">
            {filteredItems.map((item) => (
              <div key={`${item.itemType}-${item.itemRef}`} className="ud-quote-card">
                {item.bookSlug && (
                  <a className="ud-quote-card-book" href={bookLink(item.bookSlug)}>
                    {item.bookImage && (
                      // eslint-disable-next-line @next/next/no-img-element -- covers come from Supabase storage, arbitrary remote host
                      <img src={resolveCoverUrl(item.bookImage)} alt="" loading="lazy" />
                    )}
                    <div>
                      <div className="ud-quote-card-book-title">{item.bookTitle}</div>
                      <div className="ud-quote-card-book-author">{item.bookAuthor ?? ""}</div>
                    </div>
                  </a>
                )}
                <p className="ud-quote-card-text">&ldquo;{item.text}&rdquo;</p>
                {!item.bookSlug && (
                  <div className="ud-quote-card-meta">
                    <span>{item.bookTitle || "Personal"}</span>
                  </div>
                )}
                <div className="ud-quote-card-actions">
                  <Tooltip label="Remove from collection">
                    <button
                      type="button"
                      className="ud-quote-card-action is-danger"
                      aria-label="Remove from collection"
                      onClick={() => handleRemoveItem(item)}
                    >
                      <Trash2 />
                    </button>
                  </Tooltip>
                  {item.bookSlug && (
                    <Tooltip label="Read in book">
                      <a className="ud-quote-card-action" aria-label="Read in book" href={bookLink(item.bookSlug)}>
                        <ArrowUpRight />
                      </a>
                    </Tooltip>
                  )}
                  {speechSupported && (
                    <Tooltip label={playingKey === itemKey(item) ? "Stop listening" : "Listen to this quote"}>
                      <button
                        type="button"
                        className={`ud-quote-card-action ${playingKey === itemKey(item) ? "is-saved" : ""}`}
                        aria-label={playingKey === itemKey(item) ? "Stop listening" : "Listen to this quote"}
                        onClick={() => handleListen(item)}
                      >
                        {playingKey === itemKey(item) ? <Pause /> : <Volume2 />}
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="ud-collection-create-row">
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="New collection name..."
        />
        <button type="submit" className="ud-btn ud-btn-primary ud-btn-sm" disabled={!newName.trim()}>
          <Plus size={16} />
          Create
        </button>
      </form>

      {filteredCollections.length === 0 ? (
        <div className="ud-empty">
          <div className="ud-empty-icon">
            <Tag />
          </div>
          <div className="ud-empty-title">{search.trim() ? "No matches" : "No collections yet"}</div>
          <p>
            {search.trim()
              ? `No collection matches "${search}".`
              : "Create your first one above, then add quotes to it using the folder icon on any quote."}
          </p>
        </div>
      ) : (
        <div className="ud-collection-grid">
          {filteredCollections.map((collection) => (
            <div key={collection.id} className="ud-collection-card">
              {renamingId === collection.id ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveRename(collection.id);
                  }}
                >
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    autoFocus
                    onBlur={() => saveRename(collection.id)}
                  />
                </form>
              ) : (
                <button type="button" className="ud-collection-card-open" onClick={() => openCollection(collection.id)}>
                  <div className="ud-collection-card-icon">
                    <Tag />
                  </div>
                  <div className="ud-collection-card-name">{collection.name}</div>
                  <div className="ud-collection-card-count">
                    {collection.item_count} {collection.item_count === 1 ? "quote" : "quotes"}
                  </div>
                </button>
              )}
              <div className="ud-collection-card-actions">
                <Tooltip label="Rename">
                  <button
                    type="button"
                    className="ud-quote-card-action"
                    aria-label="Rename"
                    onClick={() => startRename(collection)}
                  >
                    <Pencil />
                  </button>
                </Tooltip>
                <Tooltip label="Delete">
                  <button
                    type="button"
                    className="ud-quote-card-action is-danger"
                    aria-label="Delete"
                    onClick={() => handleDelete(collection.id)}
                  >
                    <Trash2 />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
