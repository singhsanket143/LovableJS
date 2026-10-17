import type { AgentChatMessage } from "../types";

export function appendAgentMessage(
  thread: AgentChatMessage[],
  agentLabel: string,
  body: string,
): AgentChatMessage[] {
  const content = `[${agentLabel}]\n${body.trim()}`;

  return [
    ...thread,
    {
      role: "assistant",
      content,
    },
  ];
}
