import type { TodoItem } from "../../lib/plan";

const BUILDER_PLAN_FOOTER =
  "Implement these build steps in order. Use write_todos to update status (in_progress while working, completed when done). Keep each todo's content and phase unchanged; only update status.";

export function todosForBuilderPhase(todos: TodoItem[]): TodoItem[] {
  return todos.filter(
    (todo) => todo.phase === "build" && todo.status !== "cancelled",
  );
}

export function formatBuildStepsForBuilder(todos: TodoItem[]): string {
  const buildTodos = todosForBuilderPhase(todos);
  if (buildTodos.length === 0) {
    return "";
  }

  const checklist = buildTodos.map((todo, index) => {
    const mark = todo.status === "completed" ? "x" : " ";
    return `${index + 1}. [${mark}] ${todo.content.trim()}`;
  });

  return [
    "Build steps checklist (from the planner):",
    ...checklist,
    "",
    BUILDER_PLAN_FOOTER,
  ].join("\n");
}
