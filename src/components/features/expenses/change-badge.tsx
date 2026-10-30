import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ChangeKind } from "@/lib/expense-review";
import { formatMoney } from "@/lib/format";

export const signedMoney = (n: number) => `${n >= 0 ? "+" : "-"}${formatMoney(Math.abs(n))}`;

/** How a service changed from the month before, as an icon plus text (never color alone). */
export const ChangeBadge = ({ kind, diff, last }: { kind: ChangeKind | null; diff: number; last?: number | null }) => {
  if (kind === "up" || kind === "down") {
    const up = kind === "up";
    const Icon = up ? TrendingUp : TrendingDown;
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-black whitespace-nowrap ${up ? "text-danger" : "text-success"}`}>
        <Icon className="size-3.5" aria-hidden />
        {signedMoney(diff)}
        {last ? <span className="font-bold opacity-80">({up ? "+" : "-"}{Math.round((Math.abs(diff) / last) * 100)}%)</span> : null}
      </span>
    );
  }
  if (kind === "new") return <span className="bg-secondary px-1.5 text-[11px] font-black text-secondary-foreground">New</span>;
  if (kind === "missing") return <span className="bg-warning/10 px-1.5 text-[11px] font-black text-warning">Not billed</span>;
  if (kind === "same")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted">
        <Minus className="size-3" aria-hidden />
        no change
      </span>
    );
  return null;
};
