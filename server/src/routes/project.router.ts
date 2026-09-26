import { Router } from "express";
import {
  createProjectMessage,
  listProjectMessages,
} from "../controllers/message";
import {
  createProjectHandler,
  getProject,
  listProjects,
} from "../controllers/project";
import {
  createMessageBodySchema,
  createProjectBodySchema,
  idParamsSchema,
} from "../middleware/schemas";
import { validateBody, validateParams } from "../middleware/validate";

export const projectRouter = Router();

projectRouter.get("/", listProjects);
projectRouter.post("/", validateBody(createProjectBodySchema), createProjectHandler);
projectRouter.get(
  "/:id/messages",
  validateParams(idParamsSchema),
  listProjectMessages,
);
projectRouter.post(
  "/:id/messages",
  validateParams(idParamsSchema),
  validateBody(createMessageBodySchema),
  createProjectMessage,
);
projectRouter.get("/:id", validateParams(idParamsSchema), getProject);
