import type { Request, Response } from "express";
import { getAllProjects } from "../services/project.service";

export async function listProjects(_req: Request, res: Response): Promise<void> {
  const projects = await getAllProjects();
  res.status(200).json({ projects });
}
