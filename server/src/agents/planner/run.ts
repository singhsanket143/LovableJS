import { getChatModel, hasLlm } from "../../lib/model";
import { createAgent } from "langchain";
import { defaultPlan, TodoItem } from "../../lib/plan";
import { appendAgentMessage } from "../shared/handoff";
import type { PlannerInput, PlannerResult } from "../types";
import { env } from "../../config/env";
import { lastAssistantText } from "../shared/langchain";

const PLANNER_PROMPT = `
You are the planning lead. Do not write code. In 2–4 sentences, outline how you would approach building 
the user's app (UX, risks, order of work). Do not use markdown headings.
`;

type PlannerStreamState = {
  messages: unknown[];
}

function streamStateFromChunk(chunk: unknown): PlannerStreamState {
  if(!chunk || typeof chunk !== "object") return { messages: [] };

  const record = chunk as Record<string, unknown>;

  if(Array.isArray(record.messages)) {
    return { messages: record.messages };
  }

  return { messages: [] };
}

export async function runPlanner(input: PlannerInput): Promise<PlannerResult> {
  const todos: TodoItem[] = input.todos.length ? input.todos : defaultPlan(input.prompt);

  if(!hasLlm()) {
    return { thread: input.thread, todos, notes: "Created plan using the default plan" }
  }

  const agent = createAgent({
    name: "planner",
    model: getChatModel(env.OPENAI_MODEL, true),
    tools: [],
    systemPrompt: PLANNER_PROMPT,
    version: "v1",
    signal: input.signal,
  });

  const history = input.thread;
  const agentInput = {
    messages: history.length ? history : [{ role: "user", content: input.prompt }]
  };

  const stream = await agent.stream(agentInput, {
    streamMode: "values",
    recursionLimit: 12,
  });

  let chunkIndex = -1;
  let lastMessages: unknown[] = [];

  for await (const chunk of stream) {
    // drain agent stream
    chunkIndex += 1;

    input.onProgress?.(); // send a heartbeat to the temporal activity

    const { messages } = streamStateFromChunk(chunk);

    lastMessages = messages;
  }

  const notes = lastAssistantText(lastMessages) || "[Hardcoded] Plan created for the project";

  await input.onTodos?.(todos, { agent: "planner", detail: "Plan created by the agent for the project" });

  const thread = appendAgentMessage(input.thread, "planner", notes);

  return {
    notes,
    todos,
    thread,
  };
}
