import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

export const env = {
  API_PORT: Number(process.env.API_PORT) || 3000,
} as const;
