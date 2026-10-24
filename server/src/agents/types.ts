import { TodoItem } from "../lib/plan";
import { FileCollection } from "../lib/sandbox";

export interface AgentChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface AgentRunHooks {
    onProgress?: () => void;
    onTodos?: (todos: TodoItem[], activity?: { agent: string, detail: string} | null) => Promise<void>;
    signal?: AbortSignal;
}

export interface PlannerInput extends AgentRunHooks {
    prompt: string;
    todos: TodoItem[];
    thread: AgentChatMessage[];
}

export interface PlannerResult {
    notes: string;
    todos: TodoItem[];
    thread: AgentChatMessage[];
}

export interface DesignerInput extends AgentRunHooks {
    prompt: string;
    todos: TodoItem[];
    thread: AgentChatMessage[];
}

export interface DesignerResult {
    design: string;
    thread: AgentChatMessage[];
}

export interface BuilderInput extends AgentRunHooks {
    todos: TodoItem[];
    thread: AgentChatMessage[];
    sandboxId: string;
    files: FileCollection;
    design: string;
    task: string;
}

export interface BuilderResult {
    notes: string;
    thread: AgentChatMessage[];
    files: FileCollection;
}

export interface ReviewerInput extends AgentRunHooks {
    thread: AgentChatMessage[];
    sandboxId: string;
    files: FileCollection;
    design: string;
    task: string;
}

export interface ReviewerResult {
    review: string;
    thread: AgentChatMessage[];
}