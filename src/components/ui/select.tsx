import { ChevronDown } from "lucide-react";

type SelectOption = { value: string; label: string };

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  id: string;
  label: string;
  hideLabel?: boolean;
  options: readonly SelectOption[];
};

export const Select = ({ id, label, hideLabel = false, options, className = "", ...props }: SelectProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className={hideLabel ? "sr-only" : "text-sm font-semibold text-foreground"}>
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        className={`h-10 w-full appearance-none border border-border bg-surface pr-9 pl-3 text-sm text-foreground outline-none focus:border-primary focus:outline-1 focus:outline-primary ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
    </div>
  </div>
);
