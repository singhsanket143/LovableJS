import { Router } from "express";
import { listProjectMessages } from "../controllers/message";
import {
  createProjectHandler,
  getProject,
  listProjects,
} from "../controllers/project";
import { createProjectBodySchema, idParamsSchema } from "../middleware/schemas";
import { validateBody, validateParams } from "../middleware/validate";

export const projectRouter = Router();

projectRouter.get("/", listProjects);
projectRouter.post("/", validateBody(createProjectBodySchema), createProjectHandler);
projectRouter.get(
  "/:id/messages",
  validateParams(idParamsSchema),
  listProjectMessages,
);
projectRouter.get("/:id", validateParams(idParamsSchema), getProject);
