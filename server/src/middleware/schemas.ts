import { z } from "zod";

export const idParamsSchema = z.object({
  id: z.string().trim().min(1, "Id is required"),
});

export type IdParams = z.infer<typeof idParamsSchema>;

export const previewParamsSchema = z.object({
  projectId: z.string().trim().min(1, "Project id is required"),
});

export type PreviewParams = z.infer<typeof previewParamsSchema>;

export const createProjectBodySchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
});

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;

export const createMessageBodySchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
});

export type CreateMessageBody = z.infer<typeof createMessageBodySchema>;
