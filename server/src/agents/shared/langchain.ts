function messagesFromValuesChunk(chunk: unknown): { todos: unknown[], messages: unknown[] } {
  if (!chunk || typeof chunk !== "object") {
    return { todos: [], messages: [] };
  }

  const record = chunk as Record<string, unknown>;

  if ("todos" in record) {
    return {
        todos: Array.isArray(record.todos) ? record.todos : [],
        messages: Array.isArray(record.messages) ? record.messages : [],
    }
  }



  if (Array.isArray(record.messages)) {
    return { todos: [], messages: record.messages };
  }

  return { todos: [], messages: [] };
}

export async function streamAgentValues(
  stream: AsyncIterable<unknown>,
  options?: { onProgress?: () => void },
): Promise<{ messages: unknown[], todos: unknown[] }> {
  let lastMessages: unknown[] = [];
  let lastTodos: unknown[] = [];

  for await (const chunk of stream) {
    options?.onProgress?.();

    console.log("chunk", chunk);

    const { todos, messages } = messagesFromValuesChunk(chunk);
    if (messages.length > 0) {
      lastMessages = messages;
    }
    if (todos.length > 0) {
      lastTodos = todos;
    }
  }

  return { messages: lastMessages, todos: lastTodos };
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