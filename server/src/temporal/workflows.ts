import { proxyActivities } from "@temporalio/workflow";

import type * as activities from "./activities";

const { createSandbox, saveResult } = proxyActivities<typeof activities>({
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

  await saveResult({
    projectId: input.projectId,
    content: `Generated app for prompt: ${input.prompt}`,
    title: "Generated app",
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