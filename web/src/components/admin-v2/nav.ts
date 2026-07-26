import {
  Home,
  BookOpen,
  Quote,
  PenLine,
  FolderOpen,
  Star,
  Mail,
  BarChart3,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "books", label: "Books", icon: BookOpen },
  { key: "quotes", label: "Quotes", icon: Quote },
  { key: "authors", label: "Authors", icon: PenLine },
  { key: "categories", label: "Categories", icon: FolderOpen },
  { key: "featured", label: "Featured", icon: Star },
  { key: "subscribers", label: "Subscribers", icon: Mail },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];
