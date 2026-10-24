import { cancellationSignal, heartbeat } from "@temporalio/activity";

import { runPlanner } from "../agents/planner/run";
import type { AgentBasePayload, WorkflowPipelineState } from "./workflow-types";
import { hasLlm } from "../lib/model";
import { serializePlanMessage, TodoItem, updateTodoStatusForSubagent } from "../lib/plan";
import { savePlanMessage } from "../repository/message.repository";
import { runDesigner } from "../agents/designer/run";
import { runBuilder } from "../agents/builder/run";

const HEARTBEAT_INTERVAL_MS = 5_000;

type Beat = () => void;

export async function withHeartbeat<T>(
  run: (beat: Beat) => Promise<T>,
): Promise<T> {
  const beat: Beat = () => {
    try {
      heartbeat();
    } catch (error) {
      console.warn("Activity heartbeat failed:", error);
    }
  };

  const ticker = setInterval(beat, HEARTBEAT_INTERVAL_MS);

  try {
    return await run(beat);
  } finally {
    clearInterval(ticker);
  }
}


async function syncPlan(
    projectId: string,
    state: WorkflowPipelineState,
    todos: TodoItem[],
    activity?: { agent: string, detail: string} | null,
) {
    const saved = await savePlanMessage({
        projectId,
        messageId: state.planMessageId || "",
        todos,
        activity,
    });
    state.planMessageId = saved.id;

}

export async function runPlannerActivity(
  input: AgentBasePayload,
): Promise<WorkflowPipelineState> {
    if(!hasLlm()) {
        return {...input.state};
    }


    return withHeartbeat(async (beat) => {
        const started = Date.now();
        const state = { ...input.state };

        const result = await runPlanner({ // actual agent logic
            prompt: input.prompt,
            thread: state.thread,
            todos: state.todos,
            signal: cancellationSignal(),
            onProgress: beat,
            onTodos: async (todos, activity) => {
                state.todos = todos;
                console.log("onTodos", todos, activity);
                await syncPlan(input.projectId, state, todos, activity);
                beat();
            }

        });

        state.thread = result.thread;
        state.todos = updateTodoStatusForSubagent(state.todos, "design_app", "start"); // move the design related todos to in_progress status from pending status

        await syncPlan(input.projectId, state, state.todos, {
            agent: "planner",
            detail: "Handed off to designer",
        });


        return state;

    })

}


export async function runDesignerActivity(
  input: AgentBasePayload,
): Promise<WorkflowPipelineState> {
    if(!hasLlm()) {
        return {...input.state};
    }

    return withHeartbeat(async (beat) => {
        const state = { ...input.state };

        await syncPlan(input.projectId, state, state.todos, {
          agent: "designer",
          detail: "designing the ui",
        });

        const result = await runDesigner({
          prompt: input.prompt,
          todos: state.todos,
          thread: state.thread,
          signal: cancellationSignal(),
          onProgress: beat,
          onTodos: async (_todos, activity) => {
            if(activity) {
              await syncPlan(input.projectId, state, state.todos, activity);
            }
            beat();
          }
        });

        state.thread = result.thread;
        state.design = result.design;

        state.todos = updateTodoStatusForSubagent(state.todos, "design_app", "complete"); // move the design related todos to complete status from in_progress status

        state.todos = updateTodoStatusForSubagent(state.todos, "build_app", "start"); // move the build related todos to in_progress status from pending status

        await syncPlan(input.projectId, state, state.todos, {
          agent: "designer",
          detail: "design complete. handing off to builder",
        });

        return state;
    })
}

export async function runBuilderActivity(
  input: AgentBasePayload & { task: string },
): Promise<WorkflowPipelineState> {
    if(!hasLlm()) {
        return {...input.state};
    }

    return withHeartbeat(async (beat) => {
        const state = { ...input.state };

        await syncPlan(input.projectId, state, state.todos, {
            agent: "builder",
            detail: "building the app",
        });

        const result = await runBuilder({
            sandboxId: input.sandboxId,
            task: input.task,
            design: input.state.design,
            files: input.state.files,
            thread: input.state.thread,
            todos: state.todos,
            signal: cancellationSignal(),
            onProgress: beat,
            onTodos: async (_todos, activity) => {
              if(activity) {
                await syncPlan(input.projectId, state, state.todos, activity);
              }
              beat();
            }
        });

        state.thread = result.thread;
        state.files = result.files;
        state.builderNotes = result.notes;

        state.todos = updateTodoStatusForSubagent(state.todos, "build_app", "complete"); // move the build related todos to complete status from in_progress status

        await syncPlan(input.projectId, state, state.todos, {
            agent: "builder",
            detail: "builder complete. handing off to reviewer",
        });

        return state;
    })
}