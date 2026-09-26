import type { Project } from "../../generated/prisma/client";
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
          role: "user",
          type: "result",
        },
      },
    },
    include: {
      messages: true,
    },
  });
}
