import { createAgent, todoListMiddleware } from "langchain";
import { getChatModel, hasLlm } from "../../lib/model";
import { parsePlannerTodos } from "../../lib/plan";
import { BuilderInput, BuilderResult } from "../types";
import { createBuilderTools } from "./tools";
import { env } from "../../config/env";
import { BUILDER_PROMPT } from "./prompt";
import { formatBuildStepsForBuilder } from "./format-build-steps";
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

    

    const followPlannerPlan = !input.fixPass;
    const buildSteps = followPlannerPlan
        ? formatBuildStepsForBuilder(input.todos)
        : "";

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
        ...(followPlannerPlan ? { middleware: [todoListMiddleware()] } : {}),
    });

    const fileListing = Object.keys(input.files).join(", ") || "[No files]";

    const contextParts = [
        `Task:\n${input.task}`,
        `Existing Files: ${fileListing}`,
        `Design:\n${input.design}`,
    ];
    if (buildSteps) {
        contextParts.push(buildSteps);
    }
    const contextTillNow = contextParts.join("\n\n");

    const agentInput = {
        messages: [{
            role: "user",
            content: contextTillNow
        }]
    }

    let lastMessages: unknown[] = [];
    let planTodos = input.todos;

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

        if (followPlannerPlan && result.todos.length > 0) {
            const streamedTodos = parsePlannerTodos(result.todos);
            if (streamedTodos.length > 0) {
                planTodos = streamedTodos;
                await input.onTodos?.(streamedTodos, null);
            }
        }
    } catch (error) {
        if(!isRecurionLimitExceeded(error)) {
            throw error;
        }
        input.onProgress?.();
    }

    const notes =
        lastAssistantText(lastMessages) ||
        "[Hardcoded] Builder created the files for the project";

    if (followPlannerPlan) {
        await input.onTodos?.(planTodos, {
            agent: "builder",
            detail: notes,
        });
    } else {
        await input.onTodos?.([], { agent: "builder", detail: notes });
    }

    const thread = appendAgentMessage(input.thread, "builder", notes);

    return { thread, files: input.files, notes };

}