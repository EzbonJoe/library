"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Heading2, List, ListOrdered, Link as LinkIcon } from "lucide-react";

// No MDX/rich-text package is installed anywhere in this project, and posts
// only need basic formatting -- document.execCommand is deprecated but still
// works in every evergreen browser and avoids adding a new dependency just
// for a handful of admin-only buttons.
export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);
  const [activeStates, setActiveStates] = useState({ bold: false, italic: false, h2: false });

  // Only push `value` into the DOM when it changed from *outside* this
  // component (e.g. switching which post is being edited) -- syncing on
  // every keystroke would fight the browser's own cursor position.
  useEffect(() => {
    if (value !== lastValue.current && editorRef.current) {
      editorRef.current.innerHTML = value;
      lastValue.current = value;
    }
  }, [value]);

  // Toolbar buttons need to reflect the formatting at the cursor's current
  // position (e.g. Bold lit up while typing inside bold text) -- that only
  // changes on selection movement, not on the editor's own input event, so
  // it's tracked separately via the document-wide selectionchange event.
  useEffect(() => {
    function updateActiveStates() {
      const selection = window.getSelection();
      if (!selection || !editorRef.current || !selection.anchorNode) return;
      if (!editorRef.current.contains(selection.anchorNode)) return;
      setActiveStates({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        h2: document.queryCommandValue("formatBlock").toLowerCase() === "h2",
      });
    }
    document.addEventListener("selectionchange", updateActiveStates);
    return () => document.removeEventListener("selectionchange", updateActiveStates);
  }, []);

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  }

  function handleInput() {
    const html = editorRef.current?.innerHTML ?? "";
    lastValue.current = html;
    onChange(html);
  }

  function handleLink() {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
  }

  // Pasted content (from Word, Google Docs, a webpage) carries its own inline
  // styles -- including text color -- which override this editor's CSS and
  // is how pasted text was showing up black regardless of theme. Stripping
  // to plain text on paste keeps every paste consistent with the editor's
  // own styling; formatting is re-applied afterward via the toolbar.
  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleInput();
  }

  return (
    <div className="av-richtext">
      <div className="av-richtext-toolbar">
        <button
          type="button"
          className={activeStates.bold ? "is-active" : ""}
          onClick={() => exec("bold")}
          aria-label="Bold"
          aria-pressed={activeStates.bold}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          className={activeStates.italic ? "is-active" : ""}
          onClick={() => exec("italic")}
          aria-label="Italic"
          aria-pressed={activeStates.italic}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          className={activeStates.h2 ? "is-active" : ""}
          onClick={() => exec("formatBlock", activeStates.h2 ? "p" : "h2")}
          aria-label="Heading"
          aria-pressed={activeStates.h2}
        >
          <Heading2 size={16} />
        </button>
        <button type="button" onClick={() => exec("insertUnorderedList")} aria-label="Bullet list">
          <List size={16} />
        </button>
        <button type="button" onClick={() => exec("insertOrderedList")} aria-label="Numbered list">
          <ListOrdered size={16} />
        </button>
        <button type="button" onClick={handleLink} aria-label="Link">
          <LinkIcon size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        className="av-richtext-body"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
      />
    </div>
  );
}
