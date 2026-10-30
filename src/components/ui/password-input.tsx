"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { Input } from "./input";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "icon" | "endSlot">;

export const PasswordInput = (props: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      icon={Lock}
      endSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="px-3 text-muted hover:text-foreground"
        >
          <ToggleIcon className="size-4" aria-hidden />
        </button>
      }
    />
  );
};
