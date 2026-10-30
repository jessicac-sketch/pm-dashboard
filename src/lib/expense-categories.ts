// Fixed expense categories. "Others" lets the user type their own; the typed
// text is what gets saved.

export const EXPENSE_CATEGORIES = ["General", "Software Development", "Graphics Design", "HR"] as const;
export const OTHER_CATEGORY = "Others";

export const CATEGORY_OPTIONS = [
  { value: "", label: "Choose a category" },
  ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
  { value: OTHER_CATEGORY, label: OTHER_CATEGORY },
];

/** Splits a saved category into the dropdown choice and the custom text. */
export const splitCategory = (saved: string | null) => {
  if (!saved) return { choice: "", custom: "" };
  return (EXPENSE_CATEGORIES as readonly string[]).includes(saved)
    ? { choice: saved, custom: "" }
    : { choice: OTHER_CATEGORY, custom: saved };
};

/** The value to save for a dropdown choice + custom text. */
export const joinCategory = (choice: string, custom: string) =>
  choice === OTHER_CATEGORY ? custom.trim() || null : choice || null;
