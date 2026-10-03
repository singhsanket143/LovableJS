import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

export const env = {
  API_PORT: Number(process.env.API_PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233",
  TEMPORAL_NAMESPACE: process.env.TEMPORAL_NAMESPACE ?? "default",
  TEMPORAL_TASK_QUEUE: process.env.TEMPORAL_TASK_QUEUE ?? "coding-agent",
} as const;
