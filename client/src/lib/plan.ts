export type TodoStatus = "pending" | "in_progress" | "completed";

export type TodoPhase = "design" | "build" | "review";

export interface TodoItem {
  content: string;
  status: TodoStatus;
  phase?: TodoPhase;
}

export interface PlanActivity {
  agent: string;
  detail: string;
}

const PHASES: TodoPhase[] = ["design", "build", "review"];

function inferPhase(content: string): TodoPhase {
  const text = content.toLowerCase();
  if (/\b(review|polish|summary|export|verify|preview)\b/.test(text)) return "review";
  if (/\b(design|visual|ux|architect|reason|wireframe)\b/.test(text)) return "design";
  return "build";
}

function normalizeTodo(raw: unknown): TodoItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as { content?: unknown; status?: unknown; phase?: unknown };
  const content = typeof item.content === "string" ? item.content.trim() : "";
  if (!content) return null;
  const status =
    item.status === "pending" ||
    item.status === "in_progress" ||
    item.status === "completed" ||
    item.status === "cancelled"
      ? item.status === "cancelled"
        ? "completed"
        : item.status
      : "pending";
  const phase =
    typeof item.phase === "string" && PHASES.includes(item.phase as TodoPhase)
      ? (item.phase as TodoPhase)
      : inferPhase(content);
  return { content, status, phase };
}

export function parsePlanMessage(content: string): TodoItem[] | null {
  try {
    const parsed = JSON.parse(content) as { kind?: string; todos?: unknown[] };
    if (parsed?.kind !== "plan" || !Array.isArray(parsed.todos)) return null;
    const todos = parsed.todos
      .map(normalizeTodo)
      .filter((todo): todo is TodoItem => Boolean(todo));
    return todos.length ? todos : null;
  } catch {
    return null;
  }
}

export function parsePlanActivity(content: string): PlanActivity | null {
  try {
    const parsed = JSON.parse(content) as {
      kind?: string;
      activity?: { agent?: unknown; detail?: unknown };
    };
    if (parsed?.kind !== "plan") return null;
    const agent =
      typeof parsed.activity?.agent === "string" ? parsed.activity.agent.trim() : "";
    const detail =
      typeof parsed.activity?.detail === "string" ? parsed.activity.detail.trim() : "";
    if (!agent || !detail) return null;
    return { agent, detail };
  } catch {
    return null;
  }
}
