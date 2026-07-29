import { PenLine, Sparkles, Heart, Clock } from "lucide-react";
import type { NavKey } from "./nav";

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  onClick,
}: {
  icon: typeof PenLine;
  label: string;
  value: string | number;
  delta: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="ud-stat-card" onClick={onClick}>
      <div className="ud-stat-label">
        <Icon />
        {label}
      </div>
      <div className="ud-stat-value">{value}</div>
      <hr className="ud-stat-divider" />
      <div className="ud-stat-delta">{delta}</div>
    </button>
  );
}

export default function StatsGrid({
  totalQuotes,
  savedThisMonth,
  savedQuotesCount,
  memberSince,
  onSelectTab,
}: {
  totalQuotes: number;
  savedThisMonth: number;
  savedQuotesCount: number;
  memberSince: string;
  onSelectTab: (tab: NavKey) => void;
}) {
  return (
    <div className="ud-stat-grid">
      <StatCard
        icon={PenLine}
        label="My Quotes"
        value={totalQuotes}
        delta={totalQuotes === 0 ? "Add your first one" : `${totalQuotes} saved privately`}
        onClick={() => onSelectTab("my-quotes")}
      />
      <StatCard
        icon={Heart}
        label="Saved Quotes"
        value={savedQuotesCount}
        delta={savedQuotesCount === 0 ? "None bookmarked yet" : "From GadZeke's library"}
        onClick={() => onSelectTab("saved")}
      />
      <StatCard
        icon={Sparkles}
        label="This Month"
        value={savedThisMonth}
        delta={savedThisMonth === 0 ? "None saved yet" : "New this month"}
        onClick={() => onSelectTab("my-quotes")}
      />
      <StatCard
        icon={Clock}
        label="Member Since"
        value={memberSince}
        delta="Welcome back"
        onClick={() => onSelectTab("settings")}
      />
    </div>
  );
}
