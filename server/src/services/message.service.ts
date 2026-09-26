import type { Message } from "../../generated/prisma/client";
import {
  createMessage,
  findMessagesByProjectId,
} from "../repository/message.repository";
import { findProjectById } from "../repository/project.repository";

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

  return createMessage({ projectId, content });
}
