import type { Project } from "../../generated/prisma/client";
import { findAllProjects } from "../repository/project.repository";

export async function getAllProjects(): Promise<Project[]> {
  return findAllProjects();
}
