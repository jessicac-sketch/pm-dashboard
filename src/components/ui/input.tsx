import type { LucideIcon } from "lucide-react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  icon?: LucideIcon;
  /** Rendered inside the field on the right, e.g. a show/hide toggle. */
  endSlot?: React.ReactNode;
};

export const Input = ({
  id,
  label,
  hideLabel = false,
  icon: Icon,
  endSlot,
  className = "",
  ...props
}: InputProps) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className={hideLabel ? "sr-only" : "text-sm font-semibold text-foreground"}
    >
      {label}
    </label>
    <div className="flex items-center border border-border bg-surface focus-within:border-primary focus-within:outline-1 focus-within:outline-primary">
      {Icon && <Icon className="ml-3 size-4 shrink-0 text-muted" aria-hidden />}
      <input
        id={id}
        className={`w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted ${className}`}
        {...props}
      />
      {endSlot}
    </div>
  </div>
);
