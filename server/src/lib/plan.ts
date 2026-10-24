export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";

export const statuses: readonly TodoStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

export type TodoPhase = "design" | "build" | "review" | "cancelled";

export const PHASES: readonly TodoPhase[] = [
  "design",
  "build",
  "review",
  "cancelled",
];

const PHASE_INDEX: Record<TodoPhase, number> = {
  design: 0,
  build: 1,
  review: 2,
  cancelled: 3,
};

const PHASE_TAG_PATTERN = /\bphase\s*:\s*(design|build|review)\b/;

const REVIEW_PHASE_PATTERN =
  /\b(review|summary|export|verify|validation|preview|qa|q&a|quality|accessibility|a11y|audit|test|testing|edge cases|edge-case|typescript check|compile check|bundling)\b/;

const DESIGN_PHASE_PATTERN =
  /\b(define|design|designing|ux|ui|ia|information architecture|architect|architecture|reason|reasoning|wireframe|mockup|prototype|visual identity|identity|palette|typography|spacing|radius|user flow|user-flow|layout|spec|planning|file map|component plan|structure plan|scoping)\b/;

const BUILD_PHASE_PATTERN =
  /\b(build|implement|implementation|scaffold|boilerplate|develop|code|coding|wire|integrate|integration|tailwind|state|interaction|interactions|styling|style|polish|responsive|mobile|desktop|colors|touch targets|touch-target|lucide|icons|persist|localstorage|local storage|fetch|api|hook up|connect|add feature|create feature)\b/;

function phaseFromContentTag(content: string): Exclude<TodoPhase, "cancelled"> | null {
  const match = content.toLowerCase().match(PHASE_TAG_PATTERN);
  if (!match) {
    return null;
  }

  return match[1] as Exclude<TodoPhase, "cancelled">;
}

function phaseFromContentKeywords(content: string): Exclude<TodoPhase, "cancelled"> {
  const normalized = content.toLowerCase();

  if (REVIEW_PHASE_PATTERN.test(normalized)) {
    return "review";
  }

  if (DESIGN_PHASE_PATTERN.test(normalized)) {
    return "design";
  }

  if (BUILD_PHASE_PATTERN.test(normalized)) {
    return "build";
  }

  return "build";
}

export function inferToDoPhase(content: string): Exclude<TodoPhase, "cancelled"> {
  const fromTag = phaseFromContentTag(content);
  if (fromTag) {
    return fromTag;
  }

  return phaseFromContentKeywords(content);
}

function isTodoPhase(value: unknown): value is TodoPhase {
  return (
    typeof value === "string" &&
    (PHASES as readonly string[]).includes(value)
  );
}

export function parsePhase(_value: unknown, content: string): TodoPhase {
  return inferToDoPhase(content);
}

const STATUS_TRANSITIONS: Record<TodoStatus, TodoStatus[]> = { // graph edges
    pending: ["in_progress", "completed"],
    in_progress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
}

export function canTransitionStatus(from: TodoStatus, to: TodoStatus): boolean {
    if (from === to) return true;

    return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionStatus(from: TodoStatus, to: TodoStatus): TodoStatus {
    if (canTransitionStatus(from, to)) {
        return to;
    }

    throw new Error(`Cannot transition from ${from} to ${to}`);
}

function applyStatus(todo: TodoItem, to: TodoStatus): TodoItem {
    const status = transitionStatus(todo.status, to);
    return {
        ...todo,
        status,
    };
}

const TOOL_NAME_TO_PHASE: Record<string, TodoPhase> = {
    "design_app": "design",
    "build_app": "build",
    "build_ui": "build",
    "review_app": "review",
    "cancelled": "cancelled",
}

export function phaseForToolName(toolName: string): TodoPhase | null {
    if (toolName in TOOL_NAME_TO_PHASE) {
        return TOOL_NAME_TO_PHASE[toolName];
    }
    return null;
}

export function updateTodoStatusForSubagent(
    todos: TodoItem[],
    toolName: string,
    stage: "start" | "complete" | "cancel"
): TodoItem[] {

    const pipelinePhase = phaseForToolName(toolName);
    if (!pipelinePhase) return todos;

    const currentPhaseIndex = PHASE_INDEX[pipelinePhase];
    let markedCurrent = false;

    return todos.map((todo) => {
        const todoIndex = PHASE_INDEX[todo.phase];
        if(todoIndex < currentPhaseIndex) {
            return applyStatus(todo, "completed");
        }

        if(todoIndex > currentPhaseIndex) {
            if(todo.status === "in_progress") {
                return applyStatus(todo, "pending", )
            }
            return todo;
        }
        if (stage === "complete") {
            return applyStatus(todo, "completed");
        }
        if(!markedCurrent && todo.status !== "completed") {
            markedCurrent = true;
            return applyStatus(todo, "in_progress");
        }

        if(todo.status === "in_progress") {
            return applyStatus(todo, "pending");
        }
        return todo;
    })
}

export interface TodoItem {
    content: string;
    status: TodoStatus; 
    phase: TodoPhase;
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

  const { content, status, phase } = value as { content?: unknown; status?: unknown; phase?: unknown };

  if (typeof content !== "string" || content.trim() === "") {
    return null;
  }

  const parsedPhase = parsePhase(phase, content);

  return {
    content,
    status: isTodoStatus(status) ? status : "pending",
    phase: parsedPhase,
  };
}

export function parsePlannerTodos(value: unknown): TodoItem[] {
    if(!Array.isArray(value)) return [];
    return value.map((item) => normalizeToDo(item))
    .filter((item): item is TodoItem => Boolean(item));
}

function todoContentKey(content: string): string {
  return content.trim().toLowerCase();
}

/** Apply status (and phase when missing) from agent write_todos without dropping other plan steps. */
export function mergeTodoStatusUpdates(
  baseline: TodoItem[],
  updates: TodoItem[],
): TodoItem[] {
  if (updates.length === 0) {
    return baseline;
  }

  const updatesByKey = new Map(
    updates.map((todo) => [todoContentKey(todo.content), todo]),
  );

  const merged = baseline.map((todo) => {
    const update = updatesByKey.get(todoContentKey(todo.content));
    if (!update) {
      return todo;
    }
    return {
      ...todo,
      status: update.status,
    };
  });

  for (const update of updates) {
    const key = todoContentKey(update.content);
    if (!merged.some((todo) => todoContentKey(todo.content) === key)) {
      merged.push(update);
    }
  }

  return merged;
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

export function serializePlanMessage(
    todos: TodoItem[],
    activity?: PlanActivity | null,
): string{
    const payload: PlanMessage = { kind: PLAN_KIND, todos };
    if(activity?.agent && activity.detail) {
        payload.activity = activity;
    }

    return JSON.stringify(payload);
}

export function defaultPlan(prompt: string): TodoItem[] {
  const request = prompt.trim() || "the app";

  return [
    {
      content: `Design UX, information architecture, and layout for: ${request}. Phase: design`,
      status: "pending",
      phase: "design",
    },
    {
      content:
        "Scaffold the React + Tailwind boilerplate (entry, index.html/CSS) with src/App.tsx default export. Phase: build",
      status: "pending",
      phase: "build",
    },
    {
      content:
        "Implement focused UI components under src/components and wire them into App.tsx. Phase: build",
      status: "pending",
      phase: "build",
    },
    {
      content:
        "Build core interactions, state, and Tailwind styling polish for the main user flows. Phase: build",
      status: "pending",
      phase: "build",
    },
    {
      content:
        "Review accessibility, responsive layout, and edge cases; verify fixes. Phase: review",
      status: "pending",
      phase: "review",
    },
    {
      content:
        "Preview export: verify preview build and summarize what was delivered. Phase: review",
      status: "pending",
      phase: "review",
    },
  ];
}