import {
  MessageRole,
  MessageType,
  type Fragment,
  type Message,
} from "../../generated/prisma/client";
import type { AgentChatMessage } from "../agents/types";
import type { FileCollection } from "../lib/sandbox";
import { prisma } from "../lib/prisma";
import { formatPlanForAgent, parsePlanMessage, serializePlanMessage, TodoItem } from "../lib/plan";


function formatLoadedDbContent(content: string): string {
  const todos = parsePlanMessage(content); // take the message from the db and parse it as todos
  return todos ? formatPlanForAgent(todos) : content; // if the message is a plan, format it for the agent
}

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

export async function loadMessages(
  projectId: string,
): Promise<AgentChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return messages.reverse().map((message) => ({
    role:
      message.role === MessageRole.ASSISTANT
        ? ("assistant" as const)
        : ("user" as const),
    content: formatLoadedDbContent(message.content),
  }));
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
      role: MessageRole.USER,
      type: MessageType.RESULT,
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
        role: MessageRole.ASSISTANT,
        type: MessageType.ERROR,
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
      role: MessageRole.ASSISTANT,
      type: MessageType.RESULT,
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


export async function savePlanMessage(input: {
  projectId: string,
  messageId: string,
  todos: TodoItem[],
  activity?: { agent: string, detail: string} | null,
}) {
  const content = serializePlanMessage(input.todos, input.activity);
  if(input.messageId) {
      return prisma.message.update({
          where: {
              id: input.messageId,
          },
          data: {
              content,
          },
      });
  }

  return prisma.message.create({
      data: {
          projectId: input.projectId,
          content,
          role: "ASSISTANT",
          type: "RESULT"
      }
  })
}