import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** What is being paged, for screen readers, e.g. "bench". */
  label: string;
  busy?: boolean;
};

/** "11-20 of 34" with previous / next buttons. */
export const Pagination = ({ page, pageSize, total, onPageChange, label, busy = false }: PaginationProps) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const buttonClass =
    "flex size-8 items-center justify-center border border-border bg-surface text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label={`${label} pages`} className="flex items-center justify-between gap-2 text-xs text-muted">
      <span aria-live="polite" className={busy ? "opacity-60" : ""}>
        {first}-{last} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" disabled={page <= 1 || busy} onClick={() => onPageChange(page - 1)} className={buttonClass}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span className="min-w-14 text-center font-semibold text-foreground">
          {page} / {pages}
        </span>
        <button type="button" aria-label="Next page" disabled={page >= pages || busy} onClick={() => onPageChange(page + 1)} className={buttonClass}>
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
};
