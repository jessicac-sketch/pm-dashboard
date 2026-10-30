import type { LucideIcon } from "lucide-react";

type SegmentedOption<T extends string> = { value: T; label: string; icon?: LucideIcon };

type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export const SegmentedControl = <T extends string,>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => (
  <div role="group" aria-label={label} className="flex border border-border bg-surface">
    {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
      const active = optionValue === value;
      return (
        <button
          key={optionValue}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(optionValue)}
          className={`inline-flex h-10 items-center gap-2 px-3.5 text-sm font-semibold ${
            active ? "bg-ink text-primary-foreground" : "text-foreground hover:bg-accent"
          }`}
        >
          {Icon && <Icon className="size-4" aria-hidden />}
          {optionLabel}
        </button>
      );
    })}
  </div>
);
