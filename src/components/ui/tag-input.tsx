"use client";

import { X } from "lucide-react";
import { useId, useRef, useState } from "react";

export type TagOption = {
  value: string;
  label: string;
  /** Optional short text shown before the label, e.g. a project code. */
  prefix?: string;
  /** Optional classes for the pill (and the prefix in the list), e.g. a color. */
  className?: string;
};

type TagInputProps = {
  id: string;
  label: string;
  options: TagOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
};

// Multi-select shown as removable pills, with a type-to-filter list
// (combobox pattern: ↑/↓ to move, Enter to add, Backspace removes the last pill).
export const TagInput = ({ id, label, options, value, onChange, placeholder = "Type to search…", emptyText = "No matches" }: TagInputProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = value.map((v) => options.find((o) => o.value === v)).filter((o): o is TagOption => !!o);
  const q = query.trim().toLowerCase();
  const matches = options.filter(
    (o) => !value.includes(o.value) && (!q || `${o.prefix ?? ""} ${o.label}`.toLowerCase().includes(q)),
  );

  const add = (option: TagOption) => {
    onChange([...value, option.value]);
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  };
  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && matches[active]) {
        e.preventDefault();
        add(matches[active]);
      }
    } else if (e.key === "Escape" && open) {
      e.stopPropagation(); // close the list, not the surrounding dialog
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <div
        className="flex min-h-10 flex-wrap items-center gap-1.5 border border-border bg-surface px-2 py-1.5 focus-within:border-primary focus-within:outline-1 focus-within:outline-primary"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((o) => (
          <span key={o.value} className={`inline-flex items-center gap-1 py-0.5 pr-1 pl-2 text-xs font-bold ${o.className ?? "bg-secondary text-secondary-foreground"}`}>
            {o.prefix && <span className="font-black">{o.prefix}</span>}
            {o.label}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(o.value);
              }}
              aria-label={`Remove ${o.label}`}
              className="flex size-5 items-center justify-center hover:bg-ink/15"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].value}` : undefined}
          value={query}
          placeholder={selected.length ? "" : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm text-foreground outline-none placeholder:text-muted"
        />
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-y-auto border border-border bg-surface py-1 shadow-lg shadow-ink/10"
        >
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-muted">{options.length === value.length ? "All added" : emptyText}</li>}
          {matches.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${o.value}`}
              role="option"
              aria-selected={i === active}
              // mousedown so the click lands before the input blurs and closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                add(o);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${i === active ? "bg-accent" : ""}`}
            >
              {o.prefix && <span className={`px-1.5 text-[11px] font-black ${o.className ?? "bg-secondary text-secondary-foreground"}`}>{o.prefix}</span>}
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
