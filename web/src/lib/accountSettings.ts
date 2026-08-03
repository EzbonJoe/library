import type { SupabaseClient } from "@supabase/supabase-js";
import { loadCollectionItems } from "./collections";

export async function isUsernameTaken(supabase: SupabaseClient, username: string, ownId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("id").eq("username", username).neq("id", ownId).maybeSingle();
  return !!data;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  fields: { username: string; display_name: string | null },
) {
  const { error } = await supabase.from("profiles").upsert({ id: userId, ...fields });
  if (error) throw error;
}

export type AccountExport = {
  exported_at: string;
  my_quotes: { text: string; book_title: string | null }[];
  saved_quotes: { text: string; book_title: string; book_author: string | null }[];
  collections: { name: string; items: { text: string; bookTitle: string | null }[] }[];
};

// Everything the user has stored in the app, resolved into plain
// text/attribution pairs ready to render as a readable document (a PDF, not
// a JSON dump most people have no use for) -- the closest thing to a real
// "export" without standing up a server-side job.
export async function buildAccountExport(supabase: SupabaseClient, ownerId: string): Promise<AccountExport> {
  const [userQuotes, savedQuotes, collections] = await Promise.all([
    supabase.from("user_quotes").select("text, book_title").eq("owner_id", ownerId),
    supabase.from("saved_quotes").select("quote:quotes(text, book:books(title, author))").eq("owner_id", ownerId),
    supabase.from("collections").select("id, name").eq("owner_id", ownerId),
  ]);

  const collectionsWithItems = await Promise.all(
    (collections.data ?? []).map(async (collection) => ({
      name: collection.name,
      items: await loadCollectionItems(supabase, collection.id),
    })),
  );

  return {
    exported_at: new Date().toISOString(),
    my_quotes: userQuotes.data ?? [],
    saved_quotes: (savedQuotes.data ?? []).map((row) => {
      const quote = row.quote as unknown as { text: string; book: { title: string; author: string | null } };
      return { text: quote.text, book_title: quote.book.title, book_author: quote.book.author };
    }),
    collections: collectionsWithItems.map((collection) => ({
      name: collection.name,
      items: collection.items.map((item) => ({ text: item.text, bookTitle: item.bookTitle })),
    })),
  };
}

export async function downloadAccountPdf(filename: string, data: AccountExport) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - marginX * 2;
  let y = 64;

  function ensureSpace(lineHeight: number) {
    if (y + lineHeight > pageHeight - 56) {
      doc.addPage();
      y = 64;
    }
  }

  function addHeading(text: string) {
    y += 12;
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(20);
    doc.text(text, marginX, y);
    y += 22;
  }

  function addQuote(text: string, attribution: string) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(20);
    const lines: string[] = doc.splitTextToSize(`“${text}”`, maxWidth);
    for (const line of lines) {
      ensureSpace(16);
      doc.text(line, marginX, y);
      y += 16;
    }
    ensureSpace(20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`— ${attribution}`, marginX, y);
    doc.setTextColor(20);
    y += 26;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("My GadZeke Quotes", marginX, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exported ${new Date(data.exported_at).toLocaleDateString()}`, marginX, y);
  doc.setTextColor(20);
  y += 30;

  if (data.my_quotes.length) {
    addHeading("My Quotes");
    for (const quote of data.my_quotes) addQuote(quote.text, quote.book_title ?? "Personal");
  }

  if (data.saved_quotes.length) {
    addHeading("Saved Quotes");
    for (const quote of data.saved_quotes) {
      addQuote(quote.text, quote.book_author ? `${quote.book_title} — ${quote.book_author}` : quote.book_title);
    }
  }

  for (const collection of data.collections) {
    if (collection.items.length === 0) continue;
    addHeading(`Collection: ${collection.name}`);
    for (const item of collection.items) addQuote(item.text, item.bookTitle ?? "Personal");
  }

  if (data.my_quotes.length === 0 && data.saved_quotes.length === 0 && data.collections.every((c) => c.items.length === 0)) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Nothing saved yet.", marginX, y);
  }

  doc.save(filename);
}
