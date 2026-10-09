import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { env } from "../config/env";
import { getChatModel, hasLlm } from "./model";

export async function runPlainPrompt(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (!hasLlm()) {
    throw new Error(
      "No chat model provider configured. Set OPENAI_API_KEY (or a supported provider key).",
    );
  }

  const model = getChatModel(env.OPENAI_MODEL, false);
  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ]);

  const { content } = response;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("LLM returned an empty or invalid response.");
  }

  return content.trim();
}
