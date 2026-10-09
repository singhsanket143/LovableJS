import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";

import { env } from "../config/env";

const OPENAI_REASONING_MODEL_MARKERS = [
  "o1",
  "o2",
  "o3",
  "o4",
  "gpt-5",
  "gpt-6",
] as const;

export function isOpenAiReasoningModel(modelName: string): boolean {
  const normalized = modelName.toLowerCase();
  return OPENAI_REASONING_MODEL_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}

export function openaiChatModel(
  modelName: string,
  reasoning: boolean,
): ChatOpenAI {
  const base = {
    model: modelName,
    apiKey: env.OPENAI_API_KEY,
  };

  if (reasoning && isOpenAiReasoningModel(modelName)) {
    return new ChatOpenAI({
      ...base,
      reasoning: { effort: env.OPENAI_REASONING_EFFORT },
    });
  }

  return new ChatOpenAI(base);
}

export function getChatModel(
  modelName: string,
  reasoning: boolean,
): BaseChatModel {
  if (env.OPENAI_API_KEY.trim()) {
    return openaiChatModel(modelName, reasoning);
  }

  throw new Error(
    "No chat model provider configured. Set OPENAI_API_KEY (or a supported provider key).",
  );
}


