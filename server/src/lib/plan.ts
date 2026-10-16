export type TodoStatus = "pending" | "in_progress" | "completed";

export const statuses: readonly TodoStatus[] = [
  "pending",
  "in_progress",
  "completed",
];

export interface TodoItem {
    content: string;
    status: TodoStatus; 
}

function isTodoStatus(value: unknown): value is TodoStatus {
  return (
    typeof value === "string" &&
    (statuses as readonly string[]).includes(value)
  );
}

export function normalizeToDo(value: unknown): TodoItem | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const { content, status } = value as { content?: unknown; status?: unknown };

  if (typeof content !== "string" || content.trim() === "") {
    return null;
  }

  return {
    content,
    status: isTodoStatus(status) ? status : "pending",
  };
}

export function parseTodos(value: unknown): TodoItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeToDo(item))
    .filter((item): item is TodoItem => Boolean(item));
}

export function formatPlanForAgent(todos: TodoItem[]): string {
  const planLines = todos.map(
    (todo, index) => `${index + 1}. [${todo.status}] ${todo.content}`,
  );

  const footer =
    "Follow this plan in order. Update it with write_todos as you complete steps.";

  return ["Current plan:", ...planLines, "", footer].join("\n");
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

export function parsePlanMessage(content: string): TodoItem[] | null {
  let parsed: Partial<PlanMessage>;

  try {
    parsed = JSON.parse(content) as Partial<PlanMessage>;
  } catch {
    return null;
  }

  if (parsed.kind !== PLAN_KIND) {
    return null;
  }

  const todos = parseTodos(parsed.todos);
  return todos.length > 0 ? todos : null;
}