import type { FileCollection, Fragment, Message, Project } from "@/types";

type ApiProject = Project;

type ApiFragment = {
  id: string;
  messageId: string;
  sandboxUrl: string;
  title: string;
  files: FileCollection;
  createdAt: string;
  updatedAt: string;
};

type ApiMessage = {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT";
  type: "RESULT" | "ERROR";
  createdAt: string;
  updatedAt: string;
  projectId: string;
  fragments?: ApiFragment[];
};

function mapFragment(fragment: ApiFragment): Fragment {
  return {
    id: fragment.id,
    messageId: fragment.messageId,
    sandboxUrl: fragment.sandboxUrl,
    title: fragment.title,
    files: fragment.files ?? {},
    createdAt: fragment.createdAt,
    updatedAt: fragment.updatedAt,
  };
}

function mapMessage(message: ApiMessage): Message {
  const fragment = message.fragments?.[0] ? mapFragment(message.fragments[0]) : null;
  return {
    id: message.id,
    content: message.content,
    role: message.role,
    type: message.type,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    projectId: message.projectId,
    fragment,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    throw new Error(body.error ?? body.message ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  listProjects: async () => {
    const { projects } = await request<{ projects: ApiProject[] }>("/api/projects");
    return projects;
  },
  getProject: async (id: string) => {
    const { project } = await request<{ project: ApiProject }>(`/api/projects/${id}`);
    return project;
  },
  createProject: async (value: string) => {
    const { project } = await request<{ project: ApiProject }>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ message: value }),
    });
    return project;
  },
  listMessages: async (projectId: string) => {
    const { messages } = await request<{ messages: ApiMessage[] }>(
      `/api/projects/${projectId}/messages`,
    );
    return messages.map(mapMessage);
  },
  createMessage: async (projectId: string, value: string) => {
    const { message } = await request<{ message: ApiMessage }>(
      `/api/projects/${projectId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content: value }),
      },
    );
    return mapMessage(message);
  },
};
