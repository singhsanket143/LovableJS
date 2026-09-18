import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { apiRouter } from "./routes/api";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

app.listen(env.API_PORT, () => {
  console.log(`Server listening on http://localhost:${env.API_PORT}`);
});
