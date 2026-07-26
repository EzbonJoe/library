"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, BookOpen, Quote } from "lucide-react";

export const QUICK_ADD_BOOK_EVENT = "gadzeke-admin:quick-add-book";

export default function QuickAdd({ onAddQuote }: { onAddQuote: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="av-btn av-btn-primary av-btn-sm" onClick={() => setIsOpen((open) => !open)}>
        <Plus />
        Add
      </button>
      {isOpen && (
        <div
          className="av-card"
          style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", minWidth: 180, padding: 6, zIndex: 20 }}
        >
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
