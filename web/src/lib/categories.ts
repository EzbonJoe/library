// Shared category list + icons for the homepage's chip bar and the Books
// page's chip bar / category-row headings, so both stay in sync instead of
// drifting as two separately hand-maintained lists.
export const CATEGORIES = [
  { name: "Business", icon: "💼" },
  { name: "Psychology", icon: "🧠" },
  { name: "Philosophy", icon: "📜" },
  { name: "Money", icon: "💰" },
  { name: "Relationships", icon: "❤️" },
  { name: "Leadership", icon: "🏆" },
  { name: "Success", icon: "🚀" },
  { name: "Habits", icon: "🔁" },
  { name: "Spirituality", icon: "🙏" },
  { name: "Productivity", icon: "⚡" },
] as const;

export function categoryIcon(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.icon ?? "";
}
