import { Router } from "express";
import { healthCheck } from "../controllers/health";

export const apiRouter = Router();

apiRouter.get("/health", healthCheck);
