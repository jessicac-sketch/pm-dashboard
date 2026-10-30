import { NextResponse } from "next/server";
import { getAiConfig, missingAiEnv } from "@/lib/ai/config";

// GET /api/ai/health: whether the AI story writer is configured (never exposes the key).
export const GET = () => {
  const config = getAiConfig();
  return NextResponse.json(config ? { configured: true, model: config.model } : { configured: false, missing: missingAiEnv() });
};
