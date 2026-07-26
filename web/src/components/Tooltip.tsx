// Wraps an icon-only trigger (button/link with no visible text) with a
// small hover/focus label. Purely visual — the underlying element should
// already carry its own aria-label, so the bubble is aria-hidden to avoid
// screen readers announcing the same text twice.
export default function Tooltip({
  label,
  children,
  position = "above",
  align = "center",
}: {
  label: string;
  children: React.ReactNode;
  // "below" for triggers with nothing above them to render into — a fixed
  // top-of-viewport header, or a clipped ancestor (overflow: hidden) whose
  // edge sits close above the trigger.
  position?: "above" | "below";
  // "end" for triggers sitting close to the right edge of a clipped
  // ancestor (e.g. a top-right overlay button on a book cover) — the
  // default center-aligned bubble would have its right half spill past that
  // edge and get cut off, since the bubble is wider than the trigger itself.
  align?: "center" | "end";
}) {
  return (
    <span className="gz-tooltip">
      {children}
      <span
        className={`gz-tooltip-bubble ${position === "below" ? "gz-tooltip-bubble--below" : ""} ${align === "end" ? "gz-tooltip-bubble--align-end" : ""}`}
        aria-hidden="true"
      >
        {label}
      </span>
    </span>
  );
}
