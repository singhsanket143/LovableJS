import type { Project } from "../../generated/prisma/client";
import { LOCAL_USER_ID } from "../config/constants";
import { prisma } from "../lib/prisma";

export async function findAllProjects(): Promise<Project[]> {
  return prisma.project.findMany({
    where: { userId: LOCAL_USER_ID },
    orderBy: { updatedAt: "desc" },
  });
}
