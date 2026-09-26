import type { Request, Response } from "express";
import type { CreateMessageBody, IdParams } from "../middleware/schemas";
import {
  addMessageToProject,
  getMessagesByProjectId,
} from "../services/message.service";

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

export async function createProjectMessage(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params as IdParams;
  const { content } = req.body as CreateMessageBody;
  const message = await addMessageToProject(id, content);

  if (!message) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.status(201).json({ message });
}
