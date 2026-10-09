import type { Project } from "../../generated/prisma/client";
import { generateSlug } from "random-word-slugs";
import type { FileCollection } from "../lib/sandbox";
import { writeSandboxFiles } from "../lib/sandbox";
import {
  createProjectWithMessage,
  findAllProjects,
  findProjectById,
} from "../repository/project.repository";
import { saveResult } from "../repository/message.repository";
import { startCodeAgent } from "../temporal/client";

const HELLO_WORLD_FILES: FileCollection = {
  "src/App.tsx": `export default function App() {
  return <h1>Hello, world!</h1>;
}
`,
};

export async function getAllProjects(): Promise<Project[]> {
  return findAllProjects();
}

export async function getProjectById(id: string): Promise<Project | null> {
  return findProjectById(id);
}

export async function createProject(messageContent: string) {
  const name = generateSlug(3, { format: "kebab" });
  const project = await createProjectWithMessage({ name, messageContent });
  await startCodeAgent({
    projectId: project.id,
    prompt: messageContent,
  });
  return project;
}
