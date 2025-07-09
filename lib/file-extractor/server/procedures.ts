import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { eq, desc, count, sum } from "drizzle-orm";
import { FileTextExtractor } from "../utils/file-processors";
import { extractFileSchema } from "../validation/file-extraction-schema";
import { generateEmbedding } from "@/lib/utils/embedding";

export const fileExtractorRouter = createTRPCRouter({
  // Extract text from uploaded file and create document
  extractAndStore: protectedProcedure
    .input(extractFileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.userId as string;
        const { fileName, fileType, fileSize, fileData, title, subjectId } =
          input;

        // Extract text from base64 file data
        const extractedResult = await FileTextExtractor.extractFromFile(
          fileData,
          fileName,
          fileType
        );

        // Generate title if not provided
        const documentTitle = title || fileName.replace(/\.[^/.]+$/, "");

        // Generate embedding for the extracted text
        let embedding = null;
        try {
          embedding = await generateEmbedding(extractedResult.extractedText);
        } catch (embeddingError) {
          console.error(
            "Error generating embedding, continuing without it:",
            embeddingError
          );
        }

        // Store document in database
        const [newDocument] = await db
          .insert(documents)
          .values({
            userId,
            title: documentTitle,
            content: extractedResult.extractedText,
            fileName: extractedResult.fileName,
            embedding: embedding,
            metadata: extractedResult.metadata,
            fileSize: fileSize,
            fileType: fileType,
            wordCount: extractedResult.wordCount,
            pageCount: extractedResult.pageCount,
            subjectId: subjectId,
          })
          .returning();

        return {
          success: true,
          document: newDocument,
          extractedResult: {
            wordCount: extractedResult.wordCount,
            pageCount: extractedResult.pageCount,
            fileSize: fileSize,
            fileType: fileType,
          },
        };
      } catch (error) {
        console.error("Error extracting and storing file:", error);

        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to extract and store file",
        });
      }
    }),

  // Get supported file types
  getSupportedFileTypes: protectedProcedure.query(async () => {
    return {
      success: true,
      supportedTypes: [
        { type: "application/pdf", extension: ".pdf", name: "PDF Document" },
        {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          extension: ".docx",
          name: "Word Document",
        },
        {
          type: "application/msword",
          extension: ".doc",
          name: "Word Document (Legacy)",
        },
        { type: "text/plain", extension: ".txt", name: "Text File" },
        {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          extension: ".pptx",
          name: "PowerPoint Presentation",
        },
        {
          type: "application/vnd.ms-powerpoint",
          extension: ".ppt",
          name: "PowerPoint Presentation (Legacy)",
        },
        { type: "text/csv", extension: ".csv", name: "CSV File" },
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          extension: ".xlsx",
          name: "Excel Spreadsheet",
        },
        {
          type: "application/vnd.ms-excel",
          extension: ".xls",
          name: "Excel Spreadsheet (Legacy)",
        },
        { type: "text/markdown", extension: ".md", name: "Markdown File" },
        {
          type: "application/rtf",
          extension: ".rtf",
          name: "Rich Text Format",
        },
      ],
    };
  }),

  // Get extraction statistics
  getExtractionStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.userId as string;

      // Get basic counts and sums
      const statsResult = await db
        .select({
          totalDocuments: count(),
          totalWords: sum(documents.wordCount),
          totalFileSize: sum(documents.fileSize),
        })
        .from(documents)
        .where(eq(documents.userId, userId));

      const rawStats = statsResult[0];

      // Convert aggregation results to proper numbers
      const stats = {
        totalDocuments: Number(rawStats?.totalDocuments || 0),
        totalWords: Number(rawStats?.totalWords || 0),
        totalFileSize: Number(rawStats?.totalFileSize || 0),
      };

      const recentDocuments = await db
        .select({
          id: documents.id,
          title: documents.title,
          fileName: documents.fileName,
          fileType: documents.fileType,
          wordCount: documents.wordCount,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .where(eq(documents.userId, userId))
        .orderBy(desc(documents.createdAt))
        .limit(5);

      return {
        success: true,
        stats,
        recentDocuments,
      };
    } catch (error) {
      console.error("Error fetching extraction stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch extraction statistics",
      });
    }
  }),
});
