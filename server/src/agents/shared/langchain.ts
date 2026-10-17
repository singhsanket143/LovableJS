
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