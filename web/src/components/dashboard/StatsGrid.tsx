import { PenLine, Sparkles, Heart, Clock } from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: typeof PenLine;
  label: string;
  value: string | number;
  delta: string;
}) {
  return (
    <div className="ud-stat-card">
      <div className="ud-stat-label">
        <Icon />
        {label}
      </div>
      <div className="ud-stat-value">{value}</div>
      <hr className="ud-stat-divider" />
      <div className="ud-stat-delta">{delta}</div>
    </div>
  );
}

export default function StatsGrid({
  totalQuotes,
  savedThisMonth,
  savedQuotesCount,
  memberSince,
}: {
  totalQuotes: number;
  savedThisMonth: number;
  savedQuotesCount: number;
  memberSince: string;
}) {
  return (
    <div className="ud-stat-grid">
      <StatCard
        icon={PenLine}
        label="My Quotes"
        value={totalQuotes}
        delta={totalQuotes === 0 ? "Add your first one" : `${totalQuotes} saved privately`}
      />
      <StatCard
        icon={Heart}
        label="Saved Quotes"
        value={savedQuotesCount}
        delta={savedQuotesCount === 0 ? "None bookmarked yet" : "From GadZeke's library"}
      />
      <StatCard
        icon={Sparkles}
        label="This Month"
        value={savedThisMonth}
        delta={savedThisMonth === 0 ? "None saved yet" : "New this month"}
      />
      <StatCard icon={Clock} label="Member Since" value={memberSince} delta="Welcome back" />
    </div>
  );
}
