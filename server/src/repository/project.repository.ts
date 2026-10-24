import {
  MessageRole,
  MessageType,
  type Project,
} from "../../generated/prisma/client";
import { LOCAL_USER_ID } from "../config/constants";
import { prisma } from "../lib/prisma";

export async function findAllProjects(): Promise<Project[]> {
  return prisma.project.findMany({
    where: { userId: LOCAL_USER_ID },
    orderBy: { updatedAt: "desc" },
  });
}

export async function findProjectById(id: string): Promise<Project | null> {
  return prisma.project.findFirst({
    where: { id, userId: LOCAL_USER_ID },
  });
}

export async function updateProjectE2bSandboxId(
  projectId: string,
  e2bSandboxId: string,
): Promise<Project | null> {
  const existing = await findProjectById(projectId);
  if (!existing) {
    return null;
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { e2bSandboxId },
  });
}

type CreateProjectWithMessageInput = {
  name: string;
  messageContent: string;
};

export async function createProjectWithMessage(input: CreateProjectWithMessageInput) {
  return prisma.project.create({
    data: {
      name: input.name,
      userId: LOCAL_USER_ID,
      messages: {
        create: {
          content: input.messageContent,
          role: MessageRole.USER,
          type: MessageType.RESULT,
        },
      },
    },
    include: {
      messages: true,
    },
  });
}
