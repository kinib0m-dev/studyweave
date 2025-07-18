import { z } from "zod";

// Create conversation schema
export const createConversationSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  title: z.string().min(1).max(100).optional(),
  firstMessage: z
    .string()
    .min(1, "Message cannot be empty")
    .max(10000, "Message too long"),
});

export type CreateConversationSchema = z.infer<typeof createConversationSchema>;

// Send message schema
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(10000, "Message too long"),
});

export type SendMessageSchema = z.infer<typeof sendMessageSchema>;

// Get conversations schema
export const getConversationsSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export type GetConversationsSchema = z.infer<typeof getConversationsSchema>;

// Get conversation messages schema
export const getConversationMessagesSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export type GetConversationMessagesSchema = z.infer<
  typeof getConversationMessagesSchema
>;

// Delete conversation schema
export const deleteConversationSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
});

export type DeleteConversationSchema = z.infer<typeof deleteConversationSchema>;

// Source attribution types
export const sourceAttributionSchema = z.object({
  segments: z.array(
    z.object({
      content: z.string(),
      sources: z.array(
        z.object({
          documentId: z.string(),
          documentTitle: z.string(),
          confidence: z.number().min(0).max(100),
        })
      ),
      overallConfidence: z.number().min(0).max(100),
    })
  ),
});

export type SourceAttributionSchema = z.infer<typeof sourceAttributionSchema>;

// AI response schema for internal use
export const aiResponseSchema = z.object({
  content: z.string(),
  sourceAttribution: sourceAttributionSchema,
  tokenCount: z.number().optional(),
});

export type AIResponseSchema = z.infer<typeof aiResponseSchema>;
