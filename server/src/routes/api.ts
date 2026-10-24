import { Router } from "express";
import { healthCheck } from "../controllers/health";
import { previewProject } from "../controllers/project";
import { previewParamsSchema } from "../middleware/schemas";
import { validateParams } from "../middleware/validate";
import { projectRouter } from "./project.router";

export const apiRouter = Router();

apiRouter.get("/health", healthCheck);
apiRouter.get(
  "/preview/:projectId",
  validateParams(previewParamsSchema),
  previewProject,
);
apiRouter.use("/projects", projectRouter);
