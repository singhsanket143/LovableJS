export type TodoStatus = "pending" | "in_progress" | "completed";

export interface TodoItem {
    content: string;
    status: TodoStatus; 
}

export const PLAN_KIND = "plan";

export interface PlanActivity {
    agent: string;
    detail: string;
}

export interface PlanMessage {
    todos: TodoItem[];
    kind: typeof PLAN_KIND;
    activity?: PlanActivity;

}