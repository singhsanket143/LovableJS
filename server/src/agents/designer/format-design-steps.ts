import type { TodoItem } from "../../lib/plan";

const DESIGNER_SPEC_FOOTER =
  "Do not implement or build these steps. Only produce the design spec that satisfies this checklist.";

export function todosForDesignerPhase(todos: TodoItem[]): TodoItem[] {
  return todos.filter(
    (todo) => todo.phase === "design" && todo.status !== "cancelled",
  );
}

export function formatDesignStepsForDesigner(todos: TodoItem[]): string {
  const designTodos = todosForDesignerPhase(todos);
  if (designTodos.length === 0) {
    return "";
  }

  const checklist = designTodos.map(
    (todo, index) => `${index + 1}. [ ] ${todo.content.trim()}`,
  );

  return ["Design steps checkist (from the planner):", ...checklist, "", DESIGNER_SPEC_FOOTER].join(
    "\n",
  );
}
