import type { LucideIcon } from "lucide-react";

export default function ComingSoonPage({ icon: Icon, title, note }: { icon: LucideIcon; title: string; note: string }) {
  return (
    <div className="av-empty">
      <div className="av-empty-icon">
        <Icon />
      </div>
      <div className="av-empty-title">{title}</div>
      <p className="av-activity-meta" style={{ maxWidth: 420 }}>
        {note}
      </p>
    </div>
  );
}
