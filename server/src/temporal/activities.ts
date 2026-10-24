import { runPlainPrompt } from "../lib/llm";
import { FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from "../lib/prompt";
import {
  FileCollection,
  provisionProjectSandbox,
  readSandboxTree,
} from "../lib/sandbox";

export { loadMessages, saveResult } from "../repository/message.repository";
export { runPlannerActivity, runDesignerActivity, runBuilderActivity } from "./agent-activities";

/** Provisions (or reconnects) the E2B sandbox for a project and bootstraps the workdir. */
export async function createSandbox(projectId: string): Promise<string> {
  return provisionProjectSandbox(projectId);
}

export async function loadSandboxFiles(sandboxId: string): Promise<FileCollection> {
  return readSandboxTree(sandboxId);
}

export async function generateTitle(summary: string) {
  const title = await runPlainPrompt(FRAGMENT_TITLE_PROMPT, summary);
  return title
    .trim()
    .replace(/["']/g, "")
    .trim()
    .slice(0, 40) || "Untitled";
}

export async function generateResponse(summary: string) {
  const response = await runPlainPrompt(RESPONSE_PROMPT, summary);
  return response.trim();
}