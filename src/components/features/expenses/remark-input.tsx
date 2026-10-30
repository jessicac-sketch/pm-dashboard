"use client";

import { useState } from "react";
import { useSaveRemark } from "@/hooks/queries/use-expenses";

type RemarkInputProps = {
  serviceId: string;
  serviceName: string;
  month: string;
  value: string;
  required: boolean;
  placeholder: string;
  autoFocus?: boolean;
};

// Saves when the field loses focus (or on Enter); shows saving / saved / failed inline.
export const RemarkInput = ({ serviceId, serviceName, month, value, required, placeholder, autoFocus }: RemarkInputProps) => {
  const save = useSaveRemark();
  const [draft, setDraft] = useState(value);
  const missing = required && !draft.trim();

  const commit = () => {
    if (draft.trim() === value.trim()) return;
    save.mutate({ serviceId, month, remark: draft });
  };

  return (
    <div className="flex w-full flex-col gap-0.5">
      <input
        type="text"
        aria-label={`Remark for ${serviceName}`}
        aria-invalid={missing}
        placeholder={placeholder}
        value={draft}
        autoFocus={autoFocus}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className={`h-9 w-full px-2.5 text-sm outline-none focus:outline-2 focus:-outline-offset-2 focus:outline-primary ${
          missing ? "border-2 border-danger bg-danger/5" : "border border-border bg-surface"
        }`}
      />
      {save.isPending && <span className="text-[11px] text-muted">Saving…</span>}
      {save.isSuccess && !save.isPending && <span className="text-[11px] text-success">Saved</span>}
      {save.isError && <span className="text-[11px] text-danger">Couldn&apos;t save: {save.error.message}</span>}
    </div>
  );
};
