import { TodoItem } from "../lib/plan";
import { CodeAgentInput } from "./workflows";


export interface WorkflowAgentMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface WorkflowPipelineState { // this message will be passed between activities of the workflow
    todos: TodoItem[];
    thread: WorkflowAgentMessage[];
    files: Record<string, string>;
    design: string;
    builderNotes: string;
    review: string;
    summary: string;
    planMessageId?: string;
}

export interface AgentBasePayload {
    projectId: string;
    sandboxId: string;
    prompt: string;
    state: WorkflowPipelineState;
}

export function emptyPipelineState(
    thread: WorkflowAgentMessage[]
): WorkflowPipelineState {
    return {
        todos: [],
        thread,
        files: {},
        design: "",
        builderNotes: "",
        review: "",
        summary: "",
    };
}

export function createAgentBasePayload(
    input: CodeAgentInput,
    state: WorkflowPipelineState
) {
    return {
        projectId: input.projectId,
        sandboxId: input.projectId,
        prompt: input.prompt,
        state: state,
    };
}