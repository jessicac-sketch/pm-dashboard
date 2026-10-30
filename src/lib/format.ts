// "in_progress" -> "In progress"
export const formatEnum = (value: string) => {
  const words = value.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// "2026-11-14" -> "Nov 14, 2026". Parsed by parts so the date never shifts with the timezone.
export const formatDate = (isoDate: string | null) => {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const moneyShort = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// 1234.5 -> "$1,234.50"; short: "$1,235"
export const formatMoney = (amount: number, short = false) => (short ? moneyShort : money).format(amount);

// "Jessica Cruz" -> "JC", "jessicac" -> "JE"
export const getInitials = (name: string) => {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// A full timestamp such as Jira's "2026-10-30T02:35:01.584Z" -> "Oct 30, 2026" in the viewer's timezone.
export const formatTimestamp = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
