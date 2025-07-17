import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, SQL } from "drizzle-orm";
import { generateConversationTitle } from "../utils/ai-service";
import { generateStructuredChatResponse } from "../utils/ai-service";
import {
  createConversationSchema,
  deleteConversationSchema,
  getConversationsSchema,
  sendMessageSchema,
  updateConversationSchema,
} from "../validation/chat-schema";
import { extractDocumentIds, retrieveRelevantDocuments } from "@/lib/utils/rag";

export const chatRouter = createTRPCRouter({
  // Create a new conversation
  createConversation: protectedProcedure
    .input(createConversationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;

        const [newConversation] = await db
          .insert(conversations)
          .values({
            userId,
            title: input.title,
            description: input.description,
            subjectId: input.subjectId,
          })
          .returning();

        return {
          success: true,
          conversation: newConversation,
        };
      } catch (error) {
        console.error("Error creating conversation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
        });
      }
    }),

  // Get all conversations for current user
  getConversations: protectedProcedure
    .input(getConversationsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const { subjectId, limit, offset } = input;

        let whereCondition: SQL<unknown> = eq(conversations.userId, userId);

        if (subjectId) {
          whereCondition =
            and(whereCondition, eq(conversations.subjectId, subjectId)) ??
            whereCondition;
        }

        const userConversations = await db
          .select()
          .from(conversations)
          .where(whereCondition)
          .orderBy(desc(conversations.updatedAt))
          .limit(limit)
          .offset(offset);

        return {
          conversations: userConversations,
        };
      } catch (error) {
        console.error("Error fetching conversations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
        });
      }
    }),

  // Get conversation with messages
  getConversationWithMessages: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const { conversationId } = input;

        // Get conversation
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
        const conversationMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(messages.createdAt);

        return {
          conversation: {
            ...conversation,
            messages: conversationMessages,
          },
        };
      } catch (error) {
        console.error("Error fetching conversation:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversation",
        });
      }
    }),

  // Send message and get AI response
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const { conversationId, content, subjectId } = input;

        // Verify conversation ownership
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

        // Get conversation history (last 10 messages for context)
        const recentMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(desc(messages.createdAt))
          .limit(10);

        const conversationHistory = recentMessages.reverse().map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        // Retrieve relevant documents using RAG
        const relevantDocuments = await retrieveRelevantDocuments(
          content,
          userId,
          subjectId || conversation.subjectId || undefined,
          12 // Increased for better context
        );

        const documentIds = extractDocumentIds(relevantDocuments);

        // Save user message
        const [userMessage] = await db
          .insert(messages)
          .values({
            conversationId,
            role: "user",
            content,
            sources: documentIds,
          })
          .returning();

        // Generate structured AI response (always uses structured format for source tracking)
        const aiResponse = await generateStructuredChatResponse(
          content,
          conversationHistory,
          relevantDocuments
        );

        // Store the structured response as JSON string
        const structuredContent = JSON.stringify(aiResponse.structuredContent);

        // Save AI message with structured content
        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId,
            role: "assistant",
            content: structuredContent,
            sources: documentIds,
            tokenCount: aiResponse.tokenCount,
            metadata: {
              isStructured: true,
              fileUsagePercentage:
                aiResponse.structuredContent.metadata.fileUsagePercentage,
              averageConfidence:
                aiResponse.structuredContent.metadata.averageConfidence,
            },
          })
          .returning();

        // Update conversation timestamp
        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));

        // If this is the first message, update conversation title
        if (conversationHistory.length === 0) {
          const newTitle = generateConversationTitle(content);
          await db
            .update(conversations)
            .set({ title: newTitle })
            .where(eq(conversations.id, conversationId));
        }

        return {
          success: true,
          userMessage,
          assistantMessage: {
            ...assistantMessage,
            structuredContent: aiResponse.structuredContent,
          },
          sources: relevantDocuments,
          antiHallucinationData: {
            fileUsagePercentage:
              aiResponse.structuredContent.metadata.fileUsagePercentage,
            primarySources:
              aiResponse.structuredContent.metadata.primarySources,
            averageConfidence:
              aiResponse.structuredContent.metadata.averageConfidence,
          },
        };
      } catch (error) {
        console.error("Error sending message:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),

  // Update conversation
  // Update conversation
  updateConversation: protectedProcedure
    .input(updateConversationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const { id, title, description } = input;

        // Verify ownership
        const [conversation] = await db
          .select()
          .from(conversations)
          .where(
            and(eq(conversations.id, id), eq(conversations.userId, userId))
          )
          .limit(1);

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Update conversation
        const [updatedConversation] = await db
          .update(conversations)
          .set({
            title: title ?? conversation.title,
            description: description ?? conversation.description,
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, id))
          .returning();

        return {
          success: true,
          conversation: updatedConversation,
        };
      } catch (error) {
        console.error("Error updating conversation:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update conversation",
        });
      }
    }),

  // Delete conversation
  deleteConversation: protectedProcedure
    .input(deleteConversationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const { id } = input;

        // Verify ownership
        const [conversation] = await db
          .select()
          .from(conversations)
          .where(
            and(eq(conversations.id, id), eq(conversations.userId, userId))
          )
          .limit(1);

        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Delete all messages first (cascade)
        await db.delete(messages).where(eq(messages.conversationId, id));

        // Delete conversation
        await db.delete(conversations).where(eq(conversations.id, id));

        return {
          success: true,
        };
      } catch (error) {
        console.error("Error deleting conversation:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete conversation",
        });
      }
    }),
});
