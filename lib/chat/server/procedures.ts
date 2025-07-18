import {
  createTRPCRouter,
  protectedProcedure,
  subjectProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
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

  // Save assistant message
  const [assistantMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "assistant",
      content: aiResponse.content,
      sourceAttribution: aiResponse.sourceAttribution,
      sources: relevantDocuments.map((doc) => doc.id),
      tokenCount: aiResponse.tokenCount,
    })
    .returning();

  return {
    userMessage,
    assistantMessage,
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
          title || ConversationUtils.generateConversationTitle(firstMessage);

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

        // Verify conversation exists and user has access
        const [conversation] = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.id, conversationId),
              eq(conversations.userId, userId)
            )
          )
          .limit(1);

        if (!conversation) {
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

        // Update conversation timestamp
        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));

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

  // Get all conversations for a subject
  getConversations: subjectProcedure
    .input(getConversationsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { subjectId, limit, offset } = input;

        const conversationList = await db
          .select({
            id: conversations.id,
            title: conversations.title,
            description: conversations.description,
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
          conversations: conversationList,
        };
      } catch (error) {
        console.error("Error fetching conversations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
        });
      }
    }),

  // Get messages for a specific conversation
  getConversationMessages: protectedProcedure
    .input(getConversationMessagesSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { conversationId, limit, offset } = input;

        // Verify conversation exists and user has access
        const [conversation] = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.id, conversationId),
              eq(conversations.userId, userId)
            )
          )
          .limit(1);

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Get messages
        const messageList = await db
          .select({
            id: messages.id,
            role: messages.role,
            content: messages.content,
            sourceAttribution: messages.sourceAttribution,
            sources: messages.sources,
            tokenCount: messages.tokenCount,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(messages.createdAt)
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          conversation,
          messages: messageList,
        };
      } catch (error) {
        console.error("Error fetching conversation messages:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
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

        // Verify conversation exists and user has access
        const [conversation] = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.id, conversationId),
              eq(conversations.userId, userId)
            )
          )
          .limit(1);

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Delete the conversation (messages will be cascade deleted)
        await db
          .delete(conversations)
          .where(eq(conversations.id, conversationId));

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error deleting conversation:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete conversation",
        });
      }
    }),
});
