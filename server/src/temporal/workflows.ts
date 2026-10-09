import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "./activities";

const { 
  createSandbox, 
  saveResult,
  generateTitle,
  generateResponse,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
  retry: {
    maximumAttempts: 3,
  },
});

export interface CodeAgentInput {
  projectId: string;
  prompt: string;
}

export async function pingWorkflow(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

export async function codeAgentWorkflow(input: CodeAgentInput) {
  await createSandbox(input.projectId);

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