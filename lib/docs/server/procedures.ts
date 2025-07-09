import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import {
  createDocumentSchema,
  updateDocumentSchema,
} from "../validation/docs-schema";
import { generateEmbedding } from "@/lib/utils/embedding";

export const docsRouter = createTRPCRouter({
  // Create a new document
  create: protectedProcedure
    .input(createDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;

        // Generate embedding for the document content
        let embedding = null;
        try {
          embedding = await generateEmbedding(input.content);
        } catch (embeddingError) {
          console.error(
            "Error generating embedding, continuing without it:",
            embeddingError
          );
        }

        // Insert the new document with embedding
        const [newDocument] = await db
          .insert(documents)
          .values({
            userId,
            title: input.title,
            content: input.content,
            fileName: input.fileName,
            embedding: embedding,
          })
          .returning();

        return {
          success: true,
          document: newDocument,
        };
      } catch (error) {
        console.error("Error creating document:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create document",
        });
      }
    }),

  // Get a document by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        // Get the document
        const documentResult = await db
          .select()
          .from(documents)
          .where(and(eq(documents.id, input.id)))
          .limit(1);

        const document = documentResult[0];

        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        return {
          success: true,
          document,
        };
      } catch (error) {
        console.error("Error fetching bot document:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch document",
        });
      }
    }),

  // Update a document
  update: protectedProcedure
    .input(updateDocumentSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        // Check if document exists and belongs to the user
        const existingDocResult = await db
          .select()
          .from(documents)
          .where(and(eq(documents.id, id)))
          .limit(1);

        const existingDoc = existingDocResult[0];

        if (!existingDoc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        // If content has changed, regenerate the embedding
        let embeddingUpdate = {};

        if (updateData.content !== existingDoc.content) {
          try {
            const newEmbedding = await generateEmbedding(updateData.content);
            embeddingUpdate = { embedding: newEmbedding };
          } catch (embeddingError) {
            console.error(
              "Error generating embedding, continuing without it:",
              embeddingError
            );
            // We'll continue with embedding as null
          }
        }

        // Update the document with possibly new embedding
        const [updatedDoc] = await db
          .update(documents)
          .set({
            ...updateData,
            ...embeddingUpdate,
            updatedAt: new Date(),
          })
          .where(and(eq(documents.id, id)))
          .returning();

        return {
          success: true,
          document: updatedDoc,
        };
      } catch (error) {
        console.error("Error updating document:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update document",
        });
      }
    }),

  // Delete a document
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        // Check if document exists and belongs to the user
        const existingDocResult = await db
          .select()
          .from(documents)
          .where(and(eq(documents.id, input.id)))
          .limit(1);

        const existingDoc = existingDocResult[0];

        if (!existingDoc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        // Delete the document
        await db.delete(documents).where(and(eq(documents.id, input.id)));

        return {
          success: true,
          message: "Document deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting document:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete document",
        });
      }
    }),
});
