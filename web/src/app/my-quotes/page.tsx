import type { Metadata } from "next";
import UserDashboardApp from "@/components/dashboard/UserDashboardApp";

export const metadata: Metadata = {
  title: "My Library — GadZeke",
  description: "Your personal collection of timeless wisdom.",
  robots: { index: false, follow: false },
};

export default function MyQuotesPage() {
  return <UserDashboardApp />;
}
