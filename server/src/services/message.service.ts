import type { Message } from "../../generated/prisma/client";
import { findMessagesByProjectId } from "../repository/message.repository";
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
