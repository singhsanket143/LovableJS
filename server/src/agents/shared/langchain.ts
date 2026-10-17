function messagesFromValuesChunk(chunk: unknown): unknown[] {
  if (!chunk || typeof chunk !== "object") {
    return [];
  }

  const record = chunk as Record<string, unknown>;

  if (Array.isArray(record.messages)) {
    return record.messages;
  }

  return [];
}

export async function streamAgentValues(
  stream: AsyncIterable<unknown>,
  options?: { onProgress?: () => void },
): Promise<unknown[]> {
  let lastMessages: unknown[] = [];

  for await (const chunk of stream) {
    options?.onProgress?.();

    const messages = messagesFromValuesChunk(chunk);
    if (messages.length > 0) {
      lastMessages = messages;
    }
  }

  return lastMessages;
}

export function messageText(content: unknown): string {
    if(typeof content === "string") return content;

    if(!Array.isArray(content)) return "";

    return content.map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) return part.text;

        return "";

    }).join("\n").trim();
}

export function lastAssistantText(messages: unknown[]): string {
    for (let index = messages.length - 1; index >= 0; index--) {
        const message = messages[index] as { type?: string, content?: unknown };
        const isAssistant = message?.type === "ai";
        if(!isAssistant) continue;
        const text = messageText(message.content);
        if(text) return text;
    }
    return "";
}