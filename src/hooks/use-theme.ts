"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const currentTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

/** The active theme and a way to switch it. The choice is remembered in this browser. */
export const useTheme = () => {
  // Null on the server and first render; the head script has already applied the real theme.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(currentTheme()), []);

  const toggle = () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Not remembered, but the switch still works for this visit.
    }
    setTheme(next);
  };

  return { theme, toggle };
};
