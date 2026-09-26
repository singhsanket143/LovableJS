import type { Request, Response } from "express";
import type { IdParams } from "../middleware/schemas";
import { getMessagesByProjectId } from "../services/message.service";

export async function listProjectMessages(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params as IdParams;
  const messages = await getMessagesByProjectId(id);

  if (messages === null) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.status(200).json({ messages });
}
