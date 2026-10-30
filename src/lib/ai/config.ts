// AI provider settings from the environment (an OpenAI-compatible API).
// Server-side only: these variables are not NEXT_PUBLIC_, so they're never sent to the browser.

export type AiConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

const REQUIRED = ["OPENAI_API_KEY", "OPENAI_MODEL"] as const;

/** Names of required AI variables that are empty or missing. */
export const missingAiEnv = () => REQUIRED.filter((name) => !process.env[name]?.trim());

/** The AI config, or null when it isn't fully set up yet. */
export const getAiConfig = (): AiConfig | null => {
  if (typeof window !== "undefined") throw new Error("AI config must only be read on the server.");
  if (missingAiEnv().length > 0) return null;
  return {
    apiKey: process.env.OPENAI_API_KEY!.trim(),
    model: process.env.OPENAI_MODEL!.trim(),
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
  };
};
