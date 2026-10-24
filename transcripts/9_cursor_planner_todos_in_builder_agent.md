# Planner todos in builder agent
_Exported on 24/10/2026 at 21:33:24 BST from Cursor (3.22.12)_

---

**User**

are we using the todos created by the planner in builder agent ? 

---

**Cursor**

Tracing how planner todos flow into the builder agent.




**No — not in the same way the designer uses them.** Planner todos still matter for the pipeline and UI, but the builder LLM does not see the plan checklist.

### Designer (uses planner todos)

The designer turns planner todos into prompt context via `formatDesignStepsForDesigner(input.todos)`, keeping only `phase === "design"` items:

```25:36:server/src/agents/designer/run.ts
    const designSteps = formatDesignStepsForDesigner(input.todos);
    // ...
    const contextTillNow = designSteps
      ? [baseContext, designSteps].join("\n\n")
      : baseContext;
```

### Builder (does not use todo content)

`BuilderInput` includes `todos`, and `runBuilderActivity` passes `state.todos`, but **`runBuilder` never reads `input.todos`**. The model only gets a fixed task string, file names, and the design document:

```47:59:server/src/agents/builder/run.ts
    const contextTillNow = `
    Task:\n${input.task}\n\n
    Existing Files: ${fileListing}\n\n
    Design: \n${input.design}\n\n
    `;

    const agentInput = {
        messages: [{
            role: "user",
            content: contextTillNow
        }]
    }
```

The workflow task is generic, not derived from build-phase todos:

```69:72:server/src/temporal/workflows.ts
  state = await runBuilderActivity({
    ...createAgentBasePayload(input, state),
    task: "build the full React + tailwind app from the design document",
  });
```

The builder also has no `todoListMiddleware` / `write_todos`, and `onTodos` is called with an **empty** array (activity text only):

```89:89:server/src/agents/builder/run.ts
    await input.onTodos?.([], { agent: "builder", detail: notes });
```

### Where planner todos *do* show up for builder

They are still used **outside** the builder agent:

1. **Status orchestration** — e.g. `updateTodoStatusForSubagent(state.todos, "build_app", "start" | "complete")` in `agent-activities.ts`.
2. **Persisted plan message** — `syncPlan` / `savePlanMessage` for the product UI.
3. **Not in builder LLM context** — no equivalent of `formatDesignStepsForDesigner` for build-phase steps.

So today the builder is driven by the **design spec + hardcoded task**, not by the planner’s build-phase todo list. If you want parity with the designer, you’d add something like `formatBuildStepsForBuilder(todos)` and inject it into `contextTillNow` (and optionally wire `write_todos` to mark steps complete).

---

**User**

lets make sure that the first builder call uses the todos present in the todo list, and also update the todo list phase status when done

---

**Cursor**

Implementing builder use of planner todos and phase status updates. Reviewing the designer pattern and current builder/orchestration flow.




Implementing build-step formatting and wiring the first builder pass to use planner todos and sync status.




Here’s what changed:

### First builder pass uses planner todos
- Added `format-build-steps.ts` (mirrors the designer): filters `phase === "build"` items and injects a checklist into the builder prompt.
- On the **initial** build (`fixPass` unset/false), the builder gets `todoListMiddleware()` so it can call `write_todos` while working.
- Review **fix** passes stay unchanged: no checklist, no todo middleware.

### Todo status stays in sync
- **`runBuilder`**: streams todo updates to `onTodos` when the agent uses `write_todos`, then sends a final sync with builder notes.
- **`runBuilderActivity`**: when `onTodos` receives todos, it updates `state.todos` and persists via `syncPlan` (including mid-run updates without activity text).
- **After the first build completes**, existing logic still runs `updateTodoStatusForSubagent(..., "build_app", "complete")` so all build-phase items are marked completed before handoff to the reviewer.

### Other tweaks
- `BuilderInput.fixPass` documents the split between full build vs fix pass.
- Workflow task text now references completing the build-phase checklist.

Fix passes still only get the review fix task string, design, and files—no planner checklist.

---

**User**

make an api call to create a new project where we want to build a game parlour homepage 

---

**Cursor**

The create call is in flight against your local server (`dev:all` on port 3000).

### Request

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"message":"Build a modern game parlour homepage: hero with arcade vibe, featured games and consoles, pricing/membership tiers, location and hours, gallery, and a clear book-a-session CTA. Dark neon aesthetic, responsive, polished Tailwind UI."}'
```

### Project created

| Field | Value |
|--------|--------|
| **ID** | `cmvmuu17e0000rmupknov4k2g` |
| **Name** | `happy-purring-byte` |
| **Sandbox** | provisioned (`e2bSandboxId` set) |

The Temporal worker is already running the pipeline (planner finished; designer/builder in progress — see your worker logs for the game parlour plan).

### Note on response time

`POST /api/projects` waits for the full code-agent workflow (`startCodeAgent` → `handle.result()`), so **curl can stay open for several minutes** before you get `201` and the project JSON. The project row exists immediately; the HTTP response comes when the run finishes.

**Preview (when build completes):** `http://localhost:3000/api/preview/cmvmuu17e0000rmupknov4k2g`

