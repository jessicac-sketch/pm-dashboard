import type { AiConfig } from "@/lib/ai/config";

// Server-side call to an OpenAI-compatible Chat Completions API that must answer
// with JSON matching a schema. Only import this from route handlers.

export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type Message = { role: "system" | "user" | "assistant"; content: string };

const hintFor = (status: number, detail: string) =>
  status === 401
    ? "The AI provider rejected OPENAI_API_KEY."
    : status === 404
      ? `The AI provider doesn't know the model in OPENAI_MODEL. ${detail}`.trim()
      : status === 429
        ? "The AI provider is rate limiting or out of credit. Try again in a minute."
        : `The AI provider answered with HTTP ${status}. ${detail}`.trim();

export const chatJson = async <T,>(config: AiConfig, messages: Message[], schemaName: string, schema: object): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages,
        response_format: { type: "json_schema", json_schema: { name: schemaName, strict: true, schema } },
      }),
      cache: "no-store",
    });
  } catch {
    throw new AiError("Couldn't reach the AI provider. Check OPENAI_BASE_URL.", 502);
  }

  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
    choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[];
  } | null;
  if (!res.ok) throw new AiError(hintFor(res.status, body?.error?.message ?? ""), res.status);

  const choice = body?.choices?.[0];
  if (choice?.message?.refusal) throw new AiError(`The AI declined: ${choice.message.refusal}`, 422);
  if (choice?.finish_reason === "length") throw new AiError("The AI's answer was cut off. Try a smaller epic or story.", 422);
  try {
    return JSON.parse(choice?.message?.content ?? "") as T;
  } catch {
    throw new AiError("The AI answered in an unexpected format. Try again.", 502);
  }
};
