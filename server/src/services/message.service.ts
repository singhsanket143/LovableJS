import type { Message } from "../../generated/prisma/client";
import {
  createMessage,
  findMessagesByProjectId,
} from "../repository/message.repository";
import { findProjectById } from "../repository/project.repository";
import { startCodeAgent } from "../temporal/client";

export async function getMessagesByProjectId(
  projectId: string,
): Promise<Message[] | null> {
  const project = await findProjectById(projectId);

  if (!project) {
    return null;
  }

  return findMessagesByProjectId(projectId);
}

export async function addMessageToProject(
  projectId: string,
  content: string,
): Promise<Message | null> {
  const project = await findProjectById(projectId);

  if (!project) {
    return null;
  }

  const message = await createMessage({ projectId, content });

  void startCodeAgent({
    projectId,
    prompt: content,
  }).catch((error) => {
    console.error("Failed to start code agent workflow:", error);
  });

  return message;
}
