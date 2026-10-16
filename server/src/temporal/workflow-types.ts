import { TodoItem } from "../lib/plan";


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