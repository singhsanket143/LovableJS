import type { Fragment, Message } from "../../generated/prisma/client";
import type { FileCollection } from "../lib/sandbox";
import { prisma } from "../lib/prisma";

export type MessageWithFragments = Message & { fragments: Fragment[] };

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
    },
  });
}

type CreateMessageInput = {
  projectId: string;
  content: string;
};

export async function createMessage(input: CreateMessageInput): Promise<Message> {
  return prisma.message.create({
    data: {
      projectId: input.projectId,
      content: input.content,
      role: "user",
      type: "result",
    },
  });
}

type SaveResultInput = {
  projectId: string;
  content: string;
  title: string;
  files: FileCollection;
  sandboxUrl: string;
  isError?: boolean;
};

export async function saveResult(
  input: SaveResultInput,
): Promise<MessageWithFragments> {
  if (input.isError) {
    return prisma.message.create({
      data: {
        projectId: input.projectId,
        content: input.content,
        role: "assistant",
        type: "error",
      },
      include: {
        fragments: true,
      },
    });
  }

  return prisma.message.create({
    data: {
      projectId: input.projectId,
      content: input.content,
      role: "assistant",
      type: "result",
      fragments: {
        create: {
          title: input.title,
          sandboxUrl: input.sandboxUrl,
          files: input.files,
        },
      },
    },
    include: {
      fragments: true,
    },
  });
}
