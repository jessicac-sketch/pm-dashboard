"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** "lg" for forms with many fields, so they fit without scrolling. */
  size?: "md" | "lg";
  children: React.ReactNode;
};

const SIZE_CLASSES = { md: "max-w-lg", lg: "max-w-2xl" };

// Native <dialog> gives us focus trapping, Escape-to-close and a backdrop for free.
export const Dialog = ({ open, onClose, title, description, size = "md", children }: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className={`m-auto w-full ${SIZE_CLASSES[size]} border border-border bg-surface p-0 text-foreground shadow-2xl shadow-ink/30 backdrop:bg-ink/50`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-10 shrink-0 items-center justify-center text-muted hover:bg-accent hover:text-foreground"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
};
