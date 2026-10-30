import { THEME_INIT_SCRIPT } from "@/lib/theme";

// Sets data-theme on <html> before the first paint. See src/lib/theme.ts.
export const ThemeScript = () => <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
