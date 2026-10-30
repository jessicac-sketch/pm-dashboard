// Matches a card charge to a service that was set up once. A service matches
// when any of its statement texts (separated by "|") appears in the charge's
// statement name or description (case-insensitive), or when its name equals
// the merchant name read from the charge. The longest match wins, so
// "AMAZON WEB SERVICES" beats "AMAZON".

type MatchableService = { id: string; name: string; statement_match: string | null; is_active: boolean };
type MatchableCharge = { id: string; statement_name: string | null; service_name: string; amount: number | string; category?: string | null };

/** Lowercase, single spaces, and "GOOGLE *CLOUD" written the same as "GOOGLE*CLOUD". */
const norm = (v: string | null | undefined) =>
  (v ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*\*\s*/g, "*")
    .trim();

/** "aws.amazon | anthropic" → ["aws.amazon", "anthropic"] */
export const splitMatchText = (text: string | null | undefined) => norm(text).split("|").map((t) => t.trim()).filter(Boolean);

// Amex prints a fixed 20-character merchant field, then the city and state:
// "OPENAI *CHATGPT SUBSSAN FRANCISCO       CA". Only the first 20 characters
// name the merchant.
const AMEX_MERCHANT_WIDTH = 20;

/** The merchant part of a charge's statement line (falls back to the description). */
export const merchantText = (charge: { statement_name: string | null; service_name: string }) => {
  // Exports without the statement column carry the same padded text in the description.
  const statement = (charge.statement_name ?? charge.service_name).trim();
  if (statement.length <= AMEX_MERCHANT_WIDTH) return statement;
  // The fixed layout shows as space padding, or as a city glued straight onto a
  // full merchant field ("TEXAS ROADHOUSE AYALCEBU"). A sheet that collapsed the
  // padding ("ANTHROPIC SAN FRANCISCO CA") is read as plain words instead.
  const rest = statement.slice(AMEX_MERCHANT_WIDTH).toLowerCase().split(/\s+/).filter(Boolean);
  // A place or web address must start the rest; "IN VIEW CA" (from "MOUNTA|IN VIEW") must not count.
  const placeLike = (w: string) => PLACE_WORDS.has(w) || w.includes(".");
  const onlyPlace = rest.length > 0 && placeLike(rest[0]) && rest.every((w) => placeLike(w) || isRegionCode(w) || w === "city");
  const fixedLayout = /\s{2,}/.test(statement) || onlyPlace;
  return fixedLayout ? statement.slice(0, AMEX_MERCHANT_WIDTH) : statement;
};

// Payment processors that put their own name before the merchant's: "BT*SEMRUSH".
const PROCESSORS = new Set(["bt", "sq", "tst", "pp", "sp", "paypal", "paddle.net", "billdesk", "fs", "dnh", "gum", "lsc"]);
// Billing city / state words, for statement lines that aren't in the fixed Amex layout.
const PLACE_WORDS = new Set(
  (
    "san francisco jose diego mateo antonio mountain view palo alto menlo park redwood city sunnyvale los angeles seattle redmond bellevue " +
    "portland new york brooklyn boston cambridge chicago austin dallas houston denver miami atlanta washington wilmington dover " +
    "dublin london amsterdam berlin paris toronto vancouver sydney melbourne singapore tokyo hong kong " +
    "scottsdale tempe buford brighton astoria carlsbad covina louisville sheridan lehi everest greve glasgow prague " +
    "cebu manila makati taguig pasig pasay quezon mandaue lapu muntinlupa mambajao ph usa us"
  ).split(" "),
);
const NOISE_WORDS = new Set(["inc", "llc", "ltd", "limited", "corp", "co", "com", "the", "www", "https", "http", "aps", "pte", "plan", "inv", "invoice"]);
const isRegionCode = (w: string) => /^[a-z]{2}$/.test(w);
/** Reference codes: "a1010busd01", "i04746-123678", "210-312-4000". */
const isCode = (w: string) => /\d/.test(w) && (w.replace(/\D/g, "").length >= 3 || (/[a-z]/.test(w) && w.length >= 5));

const stripTrailingPlace = (words: string[]) => {
  const out = [...words];
  while (out.length > 1) {
    const last = out[out.length - 1];
    if (PLACE_WORDS.has(last) || isRegionCode(last) || isCode(last) || NOISE_WORDS.has(last)) out.pop();
    else break;
  }
  return out;
};

/** "https://scribe.how/x" → "scribe", "aws.amazon.com" → "amazon", "claude.ai" → "claude". */
const domainWord = (w: string) => {
  const host = w.replace(/^[a-z]+:\/\//, "").split("/")[0].replace(/^www\./, "");
  const labels = host.split(".").filter(Boolean);
  return labels.length >= 3 ? labels[labels.length - 2] : (labels[0] ?? "");
};

const titleCase = (s: string) => s.replace(/(^|[\s-])(\w)/g, (_, sep: string, c: string) => sep + c.toUpperCase());

const cleanWords = (text: string) => {
  let t = norm(text)
    .replace(/_/g, " ")
    // Long digit runs are order or reference numbers: "HOTELCOM733458502150".
    .replace(/\d{6,}/g, " ")
    // A non-Amex line can glue the last word to a "SAN ..." city: "SUBSSAN FRANCISCO".
    .replace(/(\w)san (francisco|antonio|jose|diego|mateo)\b/, "$1 san $2");

  // "BT*SEMRUSH" → the processor goes, keep "semrush". "GOOGLE*CLOUD" → keep both.
  const star = t.indexOf("*");
  if (star >= 0) {
    const left = t.slice(0, star).trim();
    const right = t.slice(star + 1).trim().split(" ").filter((w) => w && w !== left && !isCode(w) && !NOISE_WORDS.has(w.replace(/[#.,]+$/, "")) && !/^subs/.test(w));
    if (PROCESSORS.has(left) || left.length <= 2) t = right.join(" ");
    // "TRELLO.COM* ATLASSIAN": a domain before the star already names the service.
    else if (left.includes(".")) t = left;
    else t = [left, right[0] ?? ""].join(" ");
  }

  const words = t
    .split(" ")
    .map((w) => (/[./]/.test(w) && /[a-z]{2}/.test(w) ? domainWord(w) : w.replace(/[,.:#-]+$/, "")))
    .filter((w) => w && (w.length > 1 || w === "&") && !NOISE_WORDS.has(w) && !isCode(w) && !/^subs/.test(w));
  return stripTrailingPlace(words).filter((w, i, all) => all.indexOf(w) === i);
};

/**
 * A readable service name from a charge:
 * "ANTHROPIC           SAN FRANCISCO       CA" → "Anthropic",
 * "BT*SEMRUSH          BOSTON              MA" → "Semrush",
 * "OPENAI *CHATGPT SUBSSAN FRANCISCO       CA" → "Openai Chatgpt".
 */
export const suggestServiceName = (charge: { statement_name: string | null; service_name: string }) => {
  // The merchant field alone, or the whole line when the merchant field is only a code.
  const words = cleanWords(merchantText(charge));
  const fallback = words.length ? words : cleanWords(charge.statement_name ?? charge.service_name);
  return titleCase(fallback.join(" ")).slice(0, 40) || charge.service_name.trim();
};

/** Statement text that will match next month's charge: the shared start of the merchant fields. */
export const suggestMatchText = (merchants: string[]) => {
  const lines = merchants.map(norm).filter(Boolean);
  if (!lines.length) return "";
  let prefix = lines[0];
  for (const l of lines.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < l.length && prefix[i] === l[i]) i++;
    prefix = prefix.slice(0, i);
  }
  // Cut back to a whole word (a space or "*" ends one) unless every line was identical.
  const whole = lines.every((l) => l === prefix) ? prefix : prefix.replace(/[\s*]*[^\s*]*$/, "");
  const words = stripTrailingPlace(whole.trim().split(" ").filter(Boolean));
  const text = words.join(" ");
  return text.length >= 4 ? text : prefix.trim().length >= 4 ? prefix.trim() : lines[0];
};

export const findServiceFor = (charge: { statement_name: string | null; service_name: string }, services: MatchableService[]): string | null => {
  const haystacks = [norm(charge.statement_name), norm(charge.service_name)].filter(Boolean);
  const merchant = norm(suggestServiceName(charge));
  let best: { id: string; score: number } | null = null;
  for (const s of services) {
    const hit = splitMatchText(s.statement_match).filter((n) => haystacks.some((h) => h.includes(n)));
    let score = hit.length ? Math.max(...hit.map((n) => n.length)) : 0;
    // Same merchant name as the service (services are named from it), or the description itself.
    const name = norm(s.name);
    if (!score && name && (name === merchant || haystacks.includes(name))) score = name.length;
    // Prefer active services when two match equally.
    if (score > 0 && s.is_active) score += 0.5;
    if (score > 0 && (!best || score > best.score)) best = { id: s.id, score };
  }
  return best?.id ?? null;
};

/** The most common category among a merchant's charges ("Grpa" typos lose to the majority). */
const majorityCategory = (charges: MatchableCharge[]) => {
  const counts = new Map<string, number>();
  for (const c of charges) {
    const v = c.category?.trim();
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

export type MerchantGroup<C extends MatchableCharge> = {
  key: string;
  name: string;
  statementMatch: string;
  category: string | null;
  sample: string;
  charges: C[];
  total: number;
};

/** Charges grouped by merchant, biggest spend first. */
export const groupByMerchant = <C extends MatchableCharge>(charges: C[]): MerchantGroup<C>[] => {
  const groups = new Map<string, C[]>();
  for (const c of charges) {
    const key = suggestServiceName(c).toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  return [...groups.entries()]
    .map(([key, list]) => ({
      key,
      name: suggestServiceName(list[0]),
      statementMatch: suggestMatchText(list.map(merchantText)),
      category: majorityCategory(list),
      sample: list[0].statement_name ?? list[0].service_name,
      charges: list,
      total: list.reduce((a, c) => a + Number(c.amount), 0),
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
};
