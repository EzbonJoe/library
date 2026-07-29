"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, BookOpen, Quote } from "lucide-react";

export const QUICK_ADD_BOOK_EVENT = "gadzeke-admin:quick-add-book";

export default function QuickAdd({
  onAddQuote,
  variant = "topbar",
}: {
  onAddQuote: () => void;
  variant?: "topbar" | "fab";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isFab = variant === "fab";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={isFab ? "av-quickadd-fab" : "av-quickadd-topbar"}>
      <button
        type="button"
        className={isFab ? "av-fab-btn" : "av-btn av-btn-primary av-btn-sm"}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isFab ? "Add" : undefined}
      >
        <Plus />
        {!isFab && <span className="av-quickadd-label">Add</span>}
      </button>
      {isOpen && (
        <div className={`av-card av-quickadd-menu ${isFab ? "av-quickadd-menu--fab" : ""}`}>
          <button
            type="button"
            className="av-palette-item"
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(new CustomEvent(QUICK_ADD_BOOK_EVENT));
            }}
          >
            <BookOpen size={16} />
            Add Book
          </button>
          <button
            type="button"
            className="av-palette-item"
            onClick={() => {
              setIsOpen(false);
              onAddQuote();
            }}
          >
            <Quote size={16} />
            Add Quote
          </button>
        </div>
      )}
    </div>
  );
}
