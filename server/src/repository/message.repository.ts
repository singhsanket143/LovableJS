import type { Message } from "../../generated/prisma/client";
import { LOCAL_USER_ID } from "../config/constants";
import { prisma } from "../lib/prisma";

export async function findMessagesByProjectId(
  projectId: string,
): Promise<Message[]> {
  return prisma.message.findMany({
    where: {
      projectId,
    },
    orderBy: { createdAt: "asc" },
    include: {
      fragments: true,
    }
  });
}
