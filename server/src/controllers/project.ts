import type { Request, Response } from "express";
import type { CreateProjectBody, IdParams } from "../middleware/schemas";
import {
  createProject,
  getAllProjects,
  getProjectById,
} from "../services/project.service";

export async function listProjects(_req: Request, res: Response): Promise<void> {
  const projects = await getAllProjects();
  res.status(200).json({ projects });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const { id } = req.params as IdParams;
  const project = await getProjectById(id);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.status(200).json({ project });
}

export async function createProjectHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const { message } = req.body as CreateProjectBody;
  const project = await createProject(message);
  res.status(201).json({ project });
}
