import { z } from "zod";

// Conversation schemas
export const createConversationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().optional(),
  subjectId: z.string().optional(),
});

export const updateConversationSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  description: z.string().optional(),
});

export const deleteConversationSchema = z.object({
  id: z.string().uuid(),
});

// Message schemas
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(10000, "Message too long"),
  subjectId: z.string().optional(), // For context filtering
});

export const getMessagesSchema = z.object({
  conversationId: z.string().uuid(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// Fix: Make offset optional with default
export const getConversationsSchema = z.object({
  subjectId: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

// Anti-hallucination response schema
export const responseSegmentSchema = z.object({
  text: z.string().min(1, "Text cannot be empty"),
  type: z
    .enum(["from_file", "generated"])
    .describe("Whether the text comes from uploaded files or is AI-generated"),
  sourceDocumentId: z
    .string()
    .nullable()
    .describe("ID of the source document if type is 'from_file'"),
  sourceDocumentTitle: z
    .string()
    .nullable()
    .describe("Title of the source document if type is 'from_file'"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score for the attribution (0-1)"),
});

export const structuredResponseSchema = z.object({
  response: z
    .array(responseSegmentSchema)
    .min(1, "Response must have at least one segment"),
  metadata: z.object({
    totalSegments: z.number().min(1),
    fileBasedSegments: z.number().min(0),
    generatedSegments: z.number().min(0),
    fileUsagePercentage: z.number().min(0).max(100),
    averageConfidence: z.number().min(0).max(1),
    primarySources: z.array(
      z.object({
        documentId: z.string(),
        documentTitle: z.string(),
        usageCount: z.number(),
      })
    ),
  }),
});

// Message metadata schema
export const messageMetadataSchema = z
  .object({
    isStructured: z.boolean().optional(),
    fileUsagePercentage: z.number().min(0).max(100).optional(),
    averageConfidence: z.number().min(0).max(1).optional(),
    processingTime: z.number().optional(),
  })
  .nullable();

// Message sources schema (array of document IDs)
export const messageSourcesSchema = z.array(z.string()).nullable();

// Types
export type CreateConversationSchema = z.infer<typeof createConversationSchema>;
export type UpdateConversationSchema = z.infer<typeof updateConversationSchema>;
export type SendMessageSchema = z.infer<typeof sendMessageSchema>;
export type GetMessagesSchema = z.infer<typeof getMessagesSchema>;
export type GetConversationsSchema = z.infer<typeof getConversationsSchema>;
export type ResponseSegment = z.infer<typeof responseSegmentSchema>;
export type StructuredResponse = z.infer<typeof structuredResponseSchema>;
export type MessageMetadata = z.infer<typeof messageMetadataSchema>;
export type MessageSources = z.infer<typeof messageSourcesSchema>;

// Message role type
export type MessageRole = "user" | "assistant" | "system";

// Fixed Conversation with messages type
export type ConversationWithMessages = {
  id: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    role: MessageRole;
    content: string;
    metadata: MessageMetadata;
    sources: string[] | null;
    tokenCount: number | null;
    createdAt: Date;
  }>;
};

// User preferences schema
export const chatPreferencesSchema = z.object({
  antiHallucinationEnabled: z.boolean().default(true),
  showSourceTooltips: z.boolean().default(true),
  showFileUsagePercentage: z.boolean().default(true),
  minimumFileUsageWarning: z.number().min(0).max(100).default(70),
});

export type ChatPreferences = z.infer<typeof chatPreferencesSchema>;
