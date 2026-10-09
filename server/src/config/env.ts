import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const OPENAI_REASONING_EFFORT_VALUES = ["low", "medium", "high"] as const;

export type OpenAiReasoningEffort = (typeof OPENAI_REASONING_EFFORT_VALUES)[number];

function parseOpenAiReasoningEffort(raw: string | undefined): OpenAiReasoningEffort {
  const normalized = (raw ?? "").split("#")[0]?.trim().toLowerCase();
  if (
    OPENAI_REASONING_EFFORT_VALUES.includes(normalized as OpenAiReasoningEffort)
  ) {
    return normalized as OpenAiReasoningEffort;
  }
  return "medium";
}

export const env = {
  API_PORT: Number(process.env.API_PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENAI_REASONING_EFFORT: parseOpenAiReasoningEffort(
    process.env.OPENAI_REASONING_EFFORT,
  ),
  TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233",
  TEMPORAL_NAMESPACE: process.env.TEMPORAL_NAMESPACE ?? "default",
  TEMPORAL_TASK_QUEUE: process.env.TEMPORAL_TASK_QUEUE ?? "coding-agent",
} as const;
