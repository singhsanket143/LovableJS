import { createAgent } from "langchain";
import { getChatModel, hasLlm } from "../../lib/model";
import { DesignerInput, DesignerResult } from "../types";
import { DESIGNER_PROMPT } from "./prompt";
import { env } from "../../config/env";
import { lastAssistantText, streamAgentValues } from "../shared/langchain";
import { appendAgentMessage } from "../shared/handoff";

export async function runDesigner(input: DesignerInput) : Promise<DesignerResult> {
    if(!hasLlm()) {
        return { thread: input.thread, design: "" }
    }

    const agent = createAgent({
        name: "designer",
        model: getChatModel(env.OPENAI_MODEL, true),
        tools: [],
        systemPrompt: DESIGNER_PROMPT,
        version: "v1",
        signal: input.signal
    });

    const history = input.thread;

    const contextTillNow = history.length ? 
    `User Request:\n${input.prompt}\n\nThread so far:\n
    ${history.map((msg) => `${msg.role}: ${msg.content}`).join("\n\n")}
    `: input.prompt;

    
    const agentInput = {
        messages: [{
            role: "user",
            content: contextTillNow
        }]
    }

    const stream = await agent.stream(agentInput, {
        streamMode: "values",
        recursionLimit: 8,
      });

    const { messages: lastMessages } = await streamAgentValues(stream, {
        onProgress: input.onProgress,
    });

    const designNotes = lastAssistantText(lastMessages) || "[Hardcoded] Design created by the agent for the project";

    await input.onTodos?.([], { agent: "designer", detail: "Design created by the agent for the project" });

    const thread = appendAgentMessage(input.thread, "designer", designNotes);

    return {
        design: designNotes,
        thread,
    };
}