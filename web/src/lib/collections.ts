import type { SupabaseClient } from "@supabase/supabase-js";

export type Collection = { id: number; name: string; created_at: string; item_count: number };

export type CollectionItemType = "saved" | "personal";

// A single quote as displayed inside a collection, regardless of whether it
// came from the curated library (saved_quotes -> quotes/books) or the
// user's own writing (user_quotes) — collections mix both, so callers get
// one normalized shape instead of branching on itemType everywhere.
export type CollectionQuote = {
  itemType: CollectionItemType;
  itemRef: number;
  text: string;
  bookTitle: string | null;
  bookSlug: string | null;
  bookImage: string | null;
  bookAuthor: string | null;
};

export async function loadCollections(supabase: SupabaseClient, ownerId: string): Promise<Collection[]> {
  const { data } = await supabase
    .from("collections")
    .select("id, name, created_at, collection_items(count)")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    item_count: (row.collection_items as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function createCollection(supabase: SupabaseClient, ownerId: string, name: string) {
  const { data, error } = await supabase
    .from("collections")
    .insert({ owner_id: ownerId, name: name.trim() })
    .select("id, name, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function renameCollection(supabase: SupabaseClient, id: number, name: string) {
  await supabase.from("collections").update({ name: name.trim() }).eq("id", id);
}

export async function deleteCollection(supabase: SupabaseClient, id: number) {
  await supabase.from("collections").delete().eq("id", id);
}

export async function addItemToCollection(
  supabase: SupabaseClient,
  collectionId: number,
  itemType: CollectionItemType,
  itemRef: number,
) {
  await supabase
    .from("collection_items")
    .upsert(
      { collection_id: collectionId, item_type: itemType, item_ref: itemRef },
      { onConflict: "collection_id,item_type,item_ref", ignoreDuplicates: true },
    );
}

export async function removeItemFromCollection(
  supabase: SupabaseClient,
  collectionId: number,
  itemType: CollectionItemType,
  itemRef: number,
) {
  await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("item_type", itemType)
    .eq("item_ref", itemRef);
}

// Which collections (by id) a given item already belongs to — powers the
// checkbox state in the "Add to collection" popover.
export async function loadCollectionsForItem(
  supabase: SupabaseClient,
  itemType: CollectionItemType,
  itemRef: number,
): Promise<number[]> {
  const { data } = await supabase
    .from("collection_items")
    .select("collection_id")
    .eq("item_type", itemType)
    .eq("item_ref", itemRef);
  return (data ?? []).map((row) => row.collection_id);
}

export async function loadCollectionItems(supabase: SupabaseClient, collectionId: number): Promise<CollectionQuote[]> {
  const { data: items } = await supabase
    .from("collection_items")
    .select("item_type, item_ref, created_at")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });

  if (!items || items.length === 0) return [];

  const savedIds = items.filter((i) => i.item_type === "saved").map((i) => i.item_ref);
  const personalIds = items.filter((i) => i.item_type === "personal").map((i) => i.item_ref);

  const [savedRows, personalRows] = await Promise.all([
    savedIds.length
      ? supabase.from("quotes").select("id, text, book:books(title, image, author, slug)").in("id", savedIds)
      : Promise.resolve({ data: [] as { id: number; text: string; book: unknown }[] }),
    personalIds.length
      ? supabase.from("user_quotes").select("id, text, book_title").in("id", personalIds)
      : Promise.resolve({ data: [] as { id: number; text: string; book_title: string | null }[] }),
  ]);

  const savedById = new Map((savedRows.data ?? []).map((row) => [row.id, row]));
  const personalById = new Map((personalRows.data ?? []).map((row) => [row.id, row]));

  return items
    .map((item): CollectionQuote | null => {
      if (item.item_type === "saved") {
        const row = savedById.get(item.item_ref);
        if (!row) return null;
        const book = row.book as unknown as { title: string; image: string; author: string | null; slug: string };
        return {
          itemType: "saved",
          itemRef: item.item_ref,
          text: row.text,
          bookTitle: book.title,
          bookSlug: book.slug,
          bookImage: book.image,
          bookAuthor: book.author,
        };
      }
      const row = personalById.get(item.item_ref);
      if (!row) return null;
      return {
        itemType: "personal",
        itemRef: item.item_ref,
        text: row.text,
        bookTitle: row.book_title,
        bookSlug: null,
        bookImage: null,
        bookAuthor: null,
      };
    })
    .filter((row): row is CollectionQuote => row !== null);
}
