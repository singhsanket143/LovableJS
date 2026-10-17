import { defaultPlan, TodoItem } from "../../lib/plan";
import { appendAgentMessage } from "../shared/handoff";
import type { PlannerInput, PlannerResult } from "../types";

export async function runPlanner(input: PlannerInput): Promise<PlannerResult> {
  const todos: TodoItem[] = input.todos.length ? input.todos : defaultPlan(input.prompt);

  const notes = "Plan created for the project";

  const thread = appendAgentMessage(input.thread, "planner", notes);

  return {
    notes,
    todos,
    thread,
  };
}
