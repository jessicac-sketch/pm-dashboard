// Date helpers that work on plain "YYYY-MM-DD" strings in local time, so a
// date never shifts by a day because of the viewer's timezone.

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const todayIso = () => toIsoDate(new Date());

export const addDays = (iso: string, days: number) => {
  const d = parse(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
};

export const daysBetween = (fromIso: string, toIso: string) =>
  Math.round((parse(toIso).getTime() - parse(fromIso).getTime()) / 86_400_000);

/** Monday on or before the date. */
export const startOfWeek = (iso: string) => {
  const d = parse(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toIsoDate(d);
};

export const shortDate = (iso: string) =>
  parse(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
