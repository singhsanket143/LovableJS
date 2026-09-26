import type { Project } from "../../generated/prisma/client";
import { generateSlug } from "random-word-slugs";
import {
  createProjectWithMessage,
  findAllProjects,
  findProjectById,
} from "../repository/project.repository";

export async function getAllProjects(): Promise<Project[]> {
  return findAllProjects();
}

export async function getProjectById(id: string): Promise<Project | null> {
  return findProjectById(id);
}

export async function createProject(messageContent: string) {
  const name = generateSlug(3, { format: "kebab" });
  return createProjectWithMessage({ name, messageContent });
}
