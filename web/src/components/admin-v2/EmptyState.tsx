import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="av-empty">
      <div className="av-empty-icon">
        <Icon />
      </div>
      <div className="av-empty-title">{title}</div>
      {actionLabel && onAction && (
        <button type="button" className="av-btn av-btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
