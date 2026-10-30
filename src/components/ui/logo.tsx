import { useId } from "react";
import { MARK, WORDMARK, type LogoShape } from "@/lib/logo-paths";

type LogoProps = {
  /** "wordmark" is BABAYLAN, "mark" is the B on its own (icons, collapsed sidebar). */
  variant?: "wordmark" | "mark";
  /**
   * How far up the letters are filled, 0 to 1. The signature look is about two-thirds ("in progress").
   * Below about 120px wide, pass 1 so the logo stays crisp.
   */
  fill?: number;
  /** Fill rises from the baseline, holds, then resets (launch and loading moments). Ignores `fill`. */
  animated?: boolean;
  /** "white" is a flat silhouette for use on the brand gradient (e.g. a watermark). */
  tone?: "gradient" | "white";
  /** Accessible name. Leave out when the logo is decorative or already labelled. */
  title?: string;
  /** Size it with height or width classes; the other side follows the logo's proportions. */
  className?: string;
};

const SHAPES: Record<NonNullable<LogoProps["variant"]>, { shape: LogoShape; stroke: number }> = {
  wordmark: { shape: WORDMARK, stroke: 2 },
  mark: { shape: MARK, stroke: 2.6 },
};

/** Two-thirds filled, as on the design canvas. */
const SIGNATURE_FILL = 0.67;

export const Logo = ({ variant = "wordmark", fill = SIGNATURE_FILL, animated = false, tone = "gradient", title, className = "" }: LogoProps) => {
  // useId can contain characters that break url(#...) references, so keep only safe ones.
  const id = `logo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { shape, stroke } = SHAPES[variant];
  const [left, top, right, bottom] = shape.bounds;
  const pad = stroke;
  const viewBox = `${left - pad} ${top - pad} ${right - left + pad * 2} ${bottom - top + pad * 2}`;
  // The fill rises from the baseline: clip everything above this line.
  const level = animated ? 1 : Math.min(1, Math.max(0, fill));
  // Fully filled also covers the outline's top edge, so no sliver of background shows through.
  const fillTop = level >= 1 ? top - pad : bottom - level * (bottom - top);
  const paint = tone === "white" ? "var(--primary-foreground)" : `url(#${id}-gradient)`;

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--logo-red)" }} />
          <stop offset="1" style={{ stopColor: "var(--logo-orange)" }} />
        </linearGradient>
        <clipPath id={`${id}-fill`}>
          <rect
            x={left - pad}
            y={fillTop}
            width={right - left + pad * 2}
            height={bottom - fillTop + pad}
            className={animated ? "logo-rise" : undefined}
            // How far the animation pushes the fill down: the full letter height, so it starts empty.
            style={animated ? ({ "--logo-rise": bottom - top + pad } as React.CSSProperties) : undefined}
          />
        </clipPath>
      </defs>
      <path d={shape.d} style={{ fill: "none", stroke: paint }} strokeWidth={stroke} strokeLinejoin="round" />
      <path d={shape.d} style={{ fill: paint }} clipPath={`url(#${id}-fill)`} />
    </svg>
  );
};
