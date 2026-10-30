type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  hint?: string;
};

export const Textarea = ({ id, label, hideLabel = false, hint, className = "", ...props }: TextareaProps) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className={hideLabel ? "sr-only" : "text-sm font-semibold text-foreground"}>
      {label}
    </label>
    <textarea
      id={id}
      className={`w-full resize-y border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:outline-1 focus:outline-primary ${className}`}
      {...props}
    />
    {hint && <p className="text-xs text-muted">{hint}</p>}
  </div>
);
