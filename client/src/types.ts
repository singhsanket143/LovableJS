export type FileCollection = { [path: string]: string };

export type TreeItem = string | [string, ...TreeItem[]];

export type Project = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type Fragment = {
  id: string;
  messageId: string;
  sandboxUrl: string;
  title: string;
  files: FileCollection;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  content: string;
  role: "USER" | "ASSISTANT";
  type: "RESULT" | "ERROR";
  createdAt: string;
  updatedAt: string;
  projectId: string;
  fragment: Fragment | null;
};
