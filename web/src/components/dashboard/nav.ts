import { Home, Heart, PenLine, BookOpen, Tag, Clock, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "saved", label: "Saved Quotes", icon: Heart },
  { key: "my-quotes", label: "My Quotes", icon: PenLine },
  { key: "my-books", label: "My Books", icon: BookOpen },
  { key: "collections", label: "Collections", icon: Tag },
  { key: "recent", label: "Recently Viewed", icon: Clock },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];
