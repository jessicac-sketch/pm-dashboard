"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CATEGORY_OPTIONS, joinCategory, OTHER_CATEGORY, splitCategory } from "@/lib/expense-categories";

type CategoryPickerProps = {
  id: string;
  label: string;
  hideLabel?: boolean;
  value: string | null;
  /** Called with the category to save (null = none) once the choice is complete. */
  onChange: (category: string | null) => void;
};

/** The fixed categories, plus "Others" with a text box for your own. */
export const CategoryPicker = ({ id, label, hideLabel, value, onChange }: CategoryPickerProps) => {
  const initial = splitCategory(value);
  const [choice, setChoice] = useState(initial.choice);
  const [custom, setCustom] = useState(initial.custom);

  const pick = (next: string) => {
    setChoice(next);
    // "Others" waits for the typed name; anything else saves right away.
    if (next !== OTHER_CATEGORY) onChange(joinCategory(next, ""));
  };

  const commitCustom = () => {
    const saved = joinCategory(OTHER_CATEGORY, custom);
    if (saved && saved !== value) onChange(saved);
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-48">
        <Select id={id} label={label} hideLabel={hideLabel} options={CATEGORY_OPTIONS} value={choice} onChange={(e) => pick(e.target.value)} />
      </div>
      {choice === OTHER_CATEGORY && (
        <div className="min-w-44">
          <Input
            id={`${id}-other`}
            label="Other category"
            placeholder="e.g. Marketing"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={commitCustom}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commitCustom())}
          />
        </div>
      )}
    </div>
  );
};
