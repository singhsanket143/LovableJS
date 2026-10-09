import { runPlainPrompt } from "../lib/llm";
import { FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT } from "../lib/prompt";
import { FileCollection, readSandboxTree } from "../lib/sandbox";

export { saveResult } from "../repository/message.repository";

export async function createSandbox(projectId: string) {
  return projectId;
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