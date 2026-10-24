import { createAgent } from "langchain";
import { getChatModel, hasLlm } from "../../lib/model";
import { BuilderInput, BuilderResult } from "../types";
import { createBuilderTools } from "./tools";
import { env } from "../../config/env";
import { BUILDER_PROMPT } from "./prompt";
import {
    isRecurionLimitExceeded,
    lastAssistantText,
    streamAgentValues,
} from "../shared/langchain";
import { appendAgentMessage } from "../shared/handoff";

export async function runBuilder(input: BuilderInput): Promise<BuilderResult> {

    if(!hasLlm()) {
        return { thread: input.thread, files: input.files, notes: "Created plan using the default plan" }
    }

    const {
        terminalTool,
        readFilesTool,
        createOrUpdateFilesTool,
        compilePreviewTool,
    } = createBuilderTools(
        input.sandboxId,
        input.files,
        () => input.onProgress?.(),
    );

    

    const agent = createAgent({
        name: "builder",
        model: getChatModel(env.OPENAI_MODEL, true),
        tools: [
            terminalTool,
            readFilesTool,
            createOrUpdateFilesTool,
            compilePreviewTool,
        ],
        systemPrompt: BUILDER_PROMPT,
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
        messages: [{
            role: "user",
            content: contextTillNow
        }]
    }

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
        if(!isRecurionLimitExceeded(error)) {
            throw error;
        }
        input.onProgress?.();
    }

    const notes =
        lastAssistantText(lastMessages) ||
        "[Hardcoded] Builder created the files for the project";

    await input.onTodos?.([], { agent: "builder", detail: notes });

    const thread = appendAgentMessage(input.thread, "builder", notes);

    return { thread, files: input.files, notes };

}