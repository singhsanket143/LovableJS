import { FileCollection, readSandboxTree } from "../lib/sandbox";

export { saveResult } from "../repository/message.repository";

export async function createSandbox(projectId: string) {
  return projectId;
}

export async function loadSandboxFiles(sandboxId: string): Promise<FileCollection> {
  return readSandboxTree(sandboxId);
}