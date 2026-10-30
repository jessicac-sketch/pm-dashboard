import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "dark" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-gradient text-primary-foreground hover:brightness-110",
  // For primary actions placed on the brand gradient, where a gradient button would disappear.
  dark: "bg-ink text-primary-foreground hover:bg-ink/85",
  secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
  ghost: "text-foreground hover:bg-accent",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button = ({
  variant = "primary",
  icon: Icon,
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    {...props}
  >
    {loading ? (
      <Loader2 className="size-4 animate-spin" aria-hidden />
    ) : (
      Icon && <Icon className="size-4" aria-hidden />
    )}
    {children}
  </button>
);
