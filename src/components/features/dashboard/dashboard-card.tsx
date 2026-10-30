import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

type DashboardCardProps = {
  title: string;
  icon: LucideIcon;
  /** Icon box color: the orange highlight, or warning for cards about problems. */
  tone?: "highlight" | "warning";
  viewAllHref?: string;
  className?: string;
  children: React.ReactNode;
};

const TONE_CLASSES = { highlight: "border-highlight text-highlight", warning: "border-warning text-warning" };

// Card with an outlined icon box, a title and an optional "View all" link, as on the dashboard design.
export const DashboardCard = ({ title, icon: Icon, tone = "highlight", viewAllHref, className = "", children }: DashboardCardProps) => (
  <section aria-label={title} className={`border border-border bg-surface ${className}`}>
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex items-center gap-3">
        <span className={`flex size-8 items-center justify-center border ${TONE_CLASSES[tone]}`}>
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 className="text-base font-extrabold">{title}</h2>
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className="flex items-center gap-1.5 text-xs font-extrabold tracking-[0.12em] text-muted hover:text-foreground">
          VIEW ALL
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
    {children}
  </section>
);
