import { getInitials } from "@/lib/format";

type AvatarSize = "sm" | "md";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
};

export const Avatar = ({ name, size = "sm" }: { name: string; size?: AvatarSize }) => (
  <span
    aria-hidden
    className={`flex shrink-0 items-center justify-center bg-brand-gradient font-bold text-primary-foreground ${sizeClasses[size]}`}
  >
    {getInitials(name)}
  </span>
);
