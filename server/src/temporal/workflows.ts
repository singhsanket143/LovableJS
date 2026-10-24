import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "./activities";
import {
  createAgentBasePayload,
  emptyPipelineState,
  type WorkflowAgentMessage,
  type WorkflowPipelineState,
} from "./workflow-types";
import { extractMustFixForBuilder } from "./review-parse";

const { createSandbox } = proxyActivities<typeof activities>({
  startToCloseTimeout: "15 minutes",
  retry: {
    maximumAttempts: 3,
  },
});

const {
  saveResult,
  generateTitle,
  generateResponse,
  loadMessages,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  retry: {
    maximumAttempts: 3,
  },
});

const {
  runPlannerActivity,
  runDesignerActivity,
  runBuilderActivity,
  runReviewerActivity,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  heartbeatTimeout: "30 seconds",
  retry: {
    maximumAttempts: 3,
  },
});

const REVIEW_FIX_ROUNDS = 3;

export interface CodeAgentInput {
  projectId: string;
  prompt: string;
}

export async function pingWorkflow(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

export async function codeAgentWorkflow(input: CodeAgentInput) {
  // E2B provision + bootstrap (npm deps, compile script). Agent file ops key off projectId.
  await createSandbox(input.projectId);
  const previousMessages = await loadMessages(input.projectId);

  const thread = previousMessages.length > 0 ? [...previousMessages] : [
    { role: "user", content: input.prompt}
  ]

  let state: WorkflowPipelineState = emptyPipelineState(thread as WorkflowAgentMessage[]); // input in the temporal activity

  // running the planner agent activity
  state = await runPlannerActivity(createAgentBasePayload(input, state));
  state = await runDesignerActivity(createAgentBasePayload(input, state));
  state = await runBuilderActivity({
    ...createAgentBasePayload(input, state),
    task: "build the full React + tailwind app from the design document",
  });

  for (let round = 0; round < REVIEW_FIX_ROUNDS; round++) {
    state = await runReviewerActivity(createAgentBasePayload(input, state));
    const mustFix = extractMustFixForBuilder(state.review);
    if (!mustFix) {
      break;
    }
    state = await runBuilderActivity({
      ...createAgentBasePayload(input, state),
      task: `Fix the following MUST FIX items from code review. Only change what is required.\n\n${mustFix}`,
      fixPass: true,
    });
  }


  const SAMPLE_SUMMARY = "A custom React app tailored to create TODO list app"; // once coding agent is completed this will be coming from the agent
  const title = await generateTitle(SAMPLE_SUMMARY) ;
  const response = await generateResponse(SAMPLE_SUMMARY);

  await saveResult({
    projectId: input.projectId,
    content: response,
    title: title,
    sandboxUrl: `/api/preview/${input.projectId}`,
    files: {
      "src/App.tsx": `export default function App() {
  return <h1>Placeholder generated app</h1>;
}
`,
    },
  });

  return {
    files: null,
  }

  
}