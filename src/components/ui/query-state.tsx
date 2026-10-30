import { AlertTriangle, Inbox } from "lucide-react";
import { Logo } from "@/components/ui/logo";

type LoadingProps = {
  /**
   * "inline" (default): a small filling B with a label, for a card, panel or tab.
   * "page": the filling wordmark centred in the content area, for a whole page or screen.
   */
  variant?: "inline" | "page";
  label?: string;
};

// The Babaylan logo in its "in progress" state: the fill rises, holds, then resets.
// With reduced motion it rests at two-thirds full. role="status" announces the label once.
export const Loading = ({ variant = "inline", label = "Loading…" }: LoadingProps) =>
  variant === "page" ? (
    <div role="status" className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Logo animated className="h-10" />
      <span className="text-sm text-muted">{label}</span>
    </div>
  ) : (
    <p role="status" className="flex items-center gap-2 text-sm text-muted">
      <Logo variant="mark" animated className="size-6" />
      {label}
    </p>
  );

// Brand is red, so errors always carry an icon as well as the danger color.
export const ErrorMessage = ({ error }: { error: Error }) => (
  <p role="alert" className="flex items-start gap-2 text-sm text-danger">
    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
    {error.message}
  </p>
);

export const Empty = ({ message }: { message: string }) => (
  <p className="flex items-center gap-2 text-sm text-muted">
    <Inbox className="size-4" aria-hidden />
    {message}
  </p>
);
