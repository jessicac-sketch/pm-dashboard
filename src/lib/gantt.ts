import { addDays, daysBetween, shortDate, startOfWeek } from "@/lib/dates";

// A week-based time scale for the Gantt chart. Positions are percentages of
// the full width, so the chart stays fluid.

export type GanttScale = {
  start: string;
  totalDays: number;
  weeks: { start: string; label: string }[];
  /** Left edge of a date, in % of the chart width. */
  left: (iso: string) => number;
  /** Width of an inclusive date range, in % of the chart width. */
  width: (startIso: string, endIso: string) => number;
};

export const buildGanttScale = (rangeStart: string, rangeEnd: string): GanttScale => {
  const start = startOfWeek(rangeStart);
  const weekCount = Math.max(1, Math.ceil((daysBetween(start, rangeEnd) + 1) / 7));
  const totalDays = weekCount * 7;
  const weeks = Array.from({ length: weekCount }, (_, i) => {
    const weekStart = addDays(start, i * 7);
    return { start: weekStart, label: shortDate(weekStart) };
  });
  return {
    start,
    totalDays,
    weeks,
    left: (iso) => (daysBetween(start, iso) / totalDays) * 100,
    width: (s, e) => ((daysBetween(s, e) + 1) / totalDays) * 100,
  };
};
