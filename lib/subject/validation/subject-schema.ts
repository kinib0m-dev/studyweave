import { z } from "zod";

// Create subject schema
export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Subject name is required" })
    .max(100, { message: "Subject name must be less than 100 characters" })
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, {
      message:
        "Subject name can only contain letters, numbers, spaces, hyphens, underscores, and periods",
    }),
  description: z
    .string()
    .max(500, { message: "Description must be less than 500 characters" })
    .optional(),
  color: z.enum([
    "blue",
    "green",
    "purple",
    "red",
    "orange",
    "yellow",
    "pink",
    "teal",
    "indigo",
    "gray",
  ]),
});

export type CreateSubjectSchema = z.infer<typeof createSubjectSchema>;

// Update subject schema
export const updateSubjectSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, { message: "Subject name is required" })
    .max(100, { message: "Subject name must be less than 100 characters" })
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, {
      message:
        "Subject name can only contain letters, numbers, spaces, hyphens, underscores, and periods",
    }),
  description: z
    .string()
    .max(500, { message: "Description must be less than 500 characters" })
    .optional(),
  color: z.enum([
    "blue",
    "green",
    "purple",
    "red",
    "orange",
    "yellow",
    "pink",
    "teal",
    "indigo",
    "gray",
  ]),
});

export type UpdateSubjectSchema = z.infer<typeof updateSubjectSchema>;
