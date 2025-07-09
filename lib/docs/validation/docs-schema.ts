import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  fileName: z.string().optional(),
});

export type CreateDocumentSchema = z.infer<typeof createDocumentSchema>;

export const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  fileName: z.string().optional(),
});

export type UpdateDocumentSchema = z.infer<typeof updateDocumentSchema>;
