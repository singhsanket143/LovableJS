import { createAgent } from "langchain";
import { getChatModel, hasLlm } from "../../lib/model";
import { ReviewerInput, ReviewerResult } from "../types";
import { createReviewerTools } from "./tools";
import { env } from "../../config/env";
import { REVIEWER_PROMPT } from "./prompt";
import {
    isRecurionLimitExceeded,
    lastAssistantText,
    streamAgentValues,
} from "../shared/langchain";
import { appendAgentMessage } from "../shared/handoff";

export async function runReviewer(input: ReviewerInput): Promise<ReviewerResult> {
    if (!hasLlm()) {
        return { thread: input.thread, review: "" };
    }

    const { readFilesTool } = createReviewerTools(input.sandboxId);

    const agent = createAgent({
        name: "reviewer",
        model: getChatModel(env.OPENAI_MODEL, true),
        tools: [readFilesTool],
        systemPrompt: REVIEWER_PROMPT,
        version: "v1",
        signal: input.signal,
    });

    const fileListing = Object.keys(input.files).join(", ") || "[No files]";

    const contextTillNow = `
    Task:\n${input.task}\n\n
    Existing Files: ${fileListing}\n\n
    Design: \n${input.design}\n\n
    `;

    const agentInput = {
        messages: [
            {
                role: "user",
                content: contextTillNow,
            },
        ],
    };

    let lastMessages: unknown[] = [];

    try {
        const stream = await agent.stream(agentInput, {
            streamMode: "values",
            recursionLimit: 64,
        });

        const result = await streamAgentValues(stream, {
            onProgress: input.onProgress,
            onMessages: (messages) => {
                lastMessages = messages;
            },
        });

        lastMessages = result.messages;
    } catch (error) {
        if (!isRecurionLimitExceeded(error)) {
            throw error;
        }
        input.onProgress?.();
    }

    const review =
        lastAssistantText(lastMessages) ||
        "[Hardcoded] Review completed for the project";

    await input.onTodos?.([], { agent: "reviewer", detail: review });

    const thread = appendAgentMessage(input.thread, "reviewer", review);

    return { thread, review };
}
