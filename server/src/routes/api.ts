import { Router } from "express";
import { healthCheck } from "../controllers/health";
import { projectRouter } from "./project.router";

export const apiRouter = Router();

apiRouter.get("/health", healthCheck);
apiRouter.use("/projects", projectRouter);
