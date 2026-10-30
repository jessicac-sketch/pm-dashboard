"use client";

import { useRef, useState } from "react";

type PieceHoursInputProps = {
  hours: number;
  /** Project color classes for the strip, e.g. "bg-project-teal text-on-project-teal". */
  colorClass: string;
  label: string;
  autoFocus: boolean;
  onCommit: (hours: number) => void;
  /** Lets the piece turn off dragging while the field is being edited. */
  onEditingChange: (editing: boolean) => void;
};

// The hours strip at the bottom of a board piece, editable in place.
// The piece keys this on the hours value, so the field resets after every saved edit or undo.
export const PieceHoursInput = ({ hours, colorClass, label, autoFocus, onCommit, onEditingChange }: PieceHoursInputProps) => {
  const [text, setText] = useState(String(hours));
  const cancelled = useRef(false);

  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      return setText(String(hours));
    }
    const value = Number(text.trim());
    if (text.trim() === "" || Number.isNaN(value) || value <= 0) setText(String(hours));
    else onCommit(value);
  };

  return (
    <label
      title="Click to change hours this sprint"
      className={`group flex cursor-text items-center justify-center py-0.5 text-[11px] font-extrabold focus-within:bg-surface focus-within:text-foreground focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary hover:brightness-110 ${colorClass}`}
    >
      <span className="sr-only">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        autoFocus={autoFocus}
        draggable={false}
        onChange={(e) => setText(e.target.value.replace(/[^\d.]/g, ""))}
        onFocus={(e) => {
          onEditingChange(true);
          e.target.select();
        }}
        onBlur={() => {
          onEditingChange(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelled.current = true;
            e.currentTarget.blur();
          }
        }}
        // Width follows the digits so "20h" stays centered on the strip.
        style={{ width: `${Math.max(text.length, 1) + 0.25}ch` }}
        className="min-w-0 cursor-text bg-transparent text-center underline decoration-dotted underline-offset-2 outline-none group-focus-within:no-underline"
      />
      <span aria-hidden>h</span>
    </label>
  );
};
