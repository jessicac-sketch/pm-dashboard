"use client";

import type { LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useId, useRef, useState } from "react";
import { useDismiss, type DismissReason } from "@/hooks/use-dismiss";

const DropdownContext = createContext<{ close: () => void }>({ close: () => {} });

type DropdownMenuProps = {
  /** Content of the trigger button. */
  trigger: React.ReactNode;
  /** Accessible name for the trigger button. */
  label: string;
  align?: "start" | "end";
  children: React.ReactNode;
};

export const DropdownMenu = ({ trigger, label, align = "end", children }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Return focus to the trigger after a keyboard-ish close, but not when the user clicked elsewhere.
  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleDismiss = useCallback(
    (reason: DismissReason) => (reason === "escape" ? close() : setOpen(false)),
    [close],
  );

  useDismiss(rootRef, open, handleDismiss);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 px-2 py-1.5 text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
      >
        {trigger}
      </button>

      {open && (
        <div
          id={panelId}
          className={`absolute top-full z-30 mt-2 w-64 border border-border bg-surface py-1 shadow-lg shadow-ink/10 ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          <DropdownContext.Provider value={{ close }}>{children}</DropdownContext.Provider>
        </div>
      )}
    </div>
  );
};

type DropdownMenuItemProps = {
  icon?: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

export const DropdownMenuItem = ({
  icon: Icon,
  onSelect,
  disabled,
  children,
}: DropdownMenuItemProps) => {
  const { close } = useContext(DropdownContext);

  const handleClick = () => {
    close();
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:opacity-50"
    >
      {Icon && <Icon className="size-4 text-muted" aria-hidden />}
      {children}
    </button>
  );
};

export const DropdownMenuSeparator = () => <div className="my-1 border-t border-border" />;
