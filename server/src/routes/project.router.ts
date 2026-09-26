import { Router } from "express";
import { listProjects } from "../controllers/project";

export const projectRouter = Router();

projectRouter.get("/", listProjects);
