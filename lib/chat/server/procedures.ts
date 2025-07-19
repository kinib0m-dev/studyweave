import {
  createTRPCRouter,
  protectedProcedure,
  subjectProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { conversations, messages, documents } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import {
  createConversationSchema,
  sendMessageSchema,
  getConversationsSchema,
  getConversationMessagesSchema,
  deleteConversationSchema,
} from "../validation/chat-schemas";
import { RAGService } from "../services/rag-service";
import { AIService } from "../services/ai-service";
import { ConversationUtils } from "../utils/conversation-utils";

/**
 * Helper function to enrich message with source data
 */
async function enrichMessageWithSources(message: any) {
  if (
    !message.sources ||
    !Array.isArray(message.sources) ||
    message.sources.length === 0
  ) {
    return {
      ...message,
      sources: null,
      confidence: null,
    };
  }

  try {
    // Fetch document details for the source IDs
    const sourceDocuments = await db
      .select({
        id: documents.id,
        title: documents.title,
        fileName: documents.fileName,
      })
      .from(documents)
      .where(inArray(documents.id, message.sources));

    // Transform to the expected format
    const enrichedSources = sourceDocuments.map((doc) => ({
      documentId: doc.id,
      documentTitle: doc.fileName || doc.title,
      relevance: 0.8, // Default relevance since we don't store this in DB yet
    }));

    return {
      ...message,
      sources: enrichedSources,
      confidence: 0.8, // Default confidence since we don't store this in DB yet
    };
  } catch (error) {
    console.error("Error enriching message with sources:", error);
    return {
      ...message,
      sources: null,
      confidence: null,
    };
  }
}

/**
 * Helper function to process a message and generate AI response
 */
async function processMessage(
  content: string,
  conversationId: string,
  userId: string,
  subjectId: string
) {
  // Save user message
  const [userMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "user",
      content,
    })
    .returning();

  // Get conversation history for context
  const recentMessages = await db
    .select({
      role: messages.role,
      content: messages.content,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(10);

  const conversationHistory = ConversationUtils.formatConversationHistory(
    recentMessages.slice(0, -1) // Exclude the message we just added
  );

  // Retrieve relevant documents using RAG
  const relevantDocuments = await RAGService.retrieveRelevantDocuments(
    content,
    userId,
    subjectId
  );

  // Generate AI response
  const aiResponse = await AIService.generateResponse(
    content,
    relevantDocuments,
    conversationHistory
  );

  const [assistantMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "assistant",
      content: aiResponse.content,
      sources: aiResponse.sources.map((s) => s.documentId),
      tokenCount: aiResponse.tokenCount,
    })
    .returning();

  // Enrich the assistant message with full source data
  const enrichedAssistantMessage = await enrichMessageWithSources({
    ...assistantMessage,
    sources: aiResponse.sources.map((s) => s.documentId),
    confidence: aiResponse.confidence,
  });

  return {
    userMessage: await enrichMessageWithSources(userMessage),
    assistantMessage: {
      ...enrichedAssistantMessage,
      sources: aiResponse.sources, // Use the full source objects from AI response
      confidence: aiResponse.confidence,
    },
  };
}

export const chatRouter = createTRPCRouter({
  // Create a new conversation
  createConversation: subjectProcedure
    .input(createConversationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { subjectId, firstMessage, title } = input;

        // Generate title from first message if not provided
        const conversationTitle =
          title || AIService.generateConversationTitle(firstMessage);

        // Create the conversation
        const [newConversation] = await db
          .insert(conversations)
          .values({
            userId,
            subjectId,
            title: conversationTitle,
          })
          .returning();

        // Process the first message
        const messageResponse = await processMessage(
          firstMessage,
          newConversation.id,
          userId,
          subjectId
        );

        return {
          success: true,
          conversation: newConversation,
          firstMessage: messageResponse.userMessage,
          assistantResponse: messageResponse.assistantMessage,
        };
      } catch (error) {
        console.error("Error creating conversation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
        });
      }
    }),

  // Send a message to an existing conversation
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { conversationId, content } = input;

        // Verify conversation belongs to user
        const conversation = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId))
          .limit(1)
          .then((results) => results[0]);

        if (!conversation || conversation.userId !== userId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Process the message
        const messageResponse = await processMessage(
          content,
          conversationId,
          userId,
          conversation.subjectId
        );

        return {
          success: true,
          userMessage: messageResponse.userMessage,
          assistantResponse: messageResponse.assistantMessage,
        };
      } catch (error) {
        console.error("Error sending message:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),

  // Get conversations for a subject
  getConversations: subjectProcedure
    .input(getConversationsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { subjectId, limit, offset } = input;

        const results = await db
          .select({
            id: conversations.id,
            title: conversations.title,
            createdAt: conversations.createdAt,
            updatedAt: conversations.updatedAt,
          })
          .from(conversations)
          .where(
            and(
              eq(conversations.userId, userId),
              eq(conversations.subjectId, subjectId)
            )
          )
          .orderBy(desc(conversations.updatedAt))
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          conversations: results,
        };
      } catch (error) {
        console.error("Error fetching conversations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
        });
      }
    }),

  // Get messages for a conversation
  getConversationMessages: protectedProcedure
    .input(getConversationMessagesSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { conversationId, limit, offset } = input;

        // Verify conversation belongs to user
        const conversation = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId))
          .limit(1)
          .then((results) => results[0]);

        if (!conversation || conversation.userId !== userId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        const results = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(messages.createdAt)
          .limit(limit)
          .offset(offset);

        // Enrich all messages with source data
        const enrichedMessages = await Promise.all(
          results.map(enrichMessageWithSources)
        );

        return {
          success: true,
          messages: enrichedMessages,
        };
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch messages",
        });
      }
    }),

  // Delete a conversation
  deleteConversation: protectedProcedure
    .input(deleteConversationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { conversationId } = input;

        // Verify conversation belongs to user
        const conversation = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId))
          .limit(1)
          .then((results) => results[0]);

        if (!conversation || conversation.userId !== userId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Delete messages first (foreign key constraint)
        await db
          .delete(messages)
          .where(eq(messages.conversationId, conversationId));

        // Delete conversation
        await db
          .delete(conversations)
          .where(eq(conversations.id, conversationId));

        return {
          success: true,
          message: "Conversation deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting conversation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete conversation",
        });
      }
    }),
});
