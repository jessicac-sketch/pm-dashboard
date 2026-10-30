// Light/dark theme. Dark is the default; a person's own choice is stored per browser.
// The theme is applied as data-theme on <html>.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const DEFAULT_THEME: Theme = "dark";

/**
 * Runs inline in <head> before the page paints, so the page never flashes the wrong theme.
 * Kept as a string because it must run before React loads.
 */
export const THEME_INIT_SCRIPT = `(() => {
  let theme = null;
  try { theme = localStorage.getItem("${THEME_STORAGE_KEY}"); } catch {}
  document.documentElement.dataset.theme = theme === "light" || theme === "dark" ? theme : "${DEFAULT_THEME}";
})();`;
