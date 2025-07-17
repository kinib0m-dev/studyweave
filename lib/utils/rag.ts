import { db } from "@/db";
import { documents } from "@/db/schema";
import { generateEmbedding } from "@/lib/utils/embedding";
import { eq, and, sql, desc, SQL } from "drizzle-orm";

// Document metadata type
export interface DocumentMetadata {
  fileSize?: number;
  pageCount?: number;
  wordCount?: number;
  extractedAt?: string;
  originalFormat?: string;
  [key: string]: unknown;
}

export interface DocumentChunk {
  id: string;
  title: string;
  content: string;
  fileName: string | null;
  similarity: number;
  metadata: DocumentMetadata | null;
}

export async function retrieveRelevantDocuments(
  query: string,
  userId: string,
  subjectId?: string,
  limit: number = 5,
  similarityThreshold: number = 0.3
): Promise<DocumentChunk[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Build the where condition properly
    let whereCondition: SQL<unknown> = eq(documents.userId, userId);

    if (subjectId) {
      whereCondition =
        and(whereCondition, eq(documents.subjectId, subjectId)) ??
        whereCondition;
    }

    // First, let's check if we have any documents with embeddings
    const documentsWithEmbeddings = await db
      .select({
        id: documents.id,
        title: documents.title,
        embedding: documents.embedding,
      })
      .from(documents)
      .where(
        and(whereCondition, sql`${documents.embedding} IS NOT NULL`) ??
          whereCondition
      );

    if (documentsWithEmbeddings.length === 0) {
      // Fallback: return documents without similarity scoring
      const fallbackResults = await db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
          fileName: documents.fileName,
          metadata: documents.metadata,
        })
        .from(documents)
        .where(whereCondition)
        .orderBy(desc(documents.createdAt))
        .limit(limit);

      return fallbackResults.map((result) => ({
        ...result,
        similarity: 0.5,
        metadata: result.metadata as DocumentMetadata | null,
      }));
    }

    // Add embedding existence and similarity threshold conditions
    const embeddingCondition = sql`${documents.embedding} IS NOT NULL`;
    const similarityCondition = sql`1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)}) > ${similarityThreshold}`;

    whereCondition =
      and(whereCondition, embeddingCondition, similarityCondition) ??
      whereCondition;

    // Perform vector similarity search
    const results = await db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        fileName: documents.fileName,
        metadata: documents.metadata,
        similarity: sql<number>`1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)})`,
      })
      .from(documents)
      .where(whereCondition)
      .orderBy(
        desc(
          sql`1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)})`
        )
      )
      .limit(limit);

    // If similarity search returns too few results, get more documents
    if (results.length < Math.min(limit, 3)) {
      const additionalResults = await db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
          fileName: documents.fileName,
          metadata: documents.metadata,
          similarity: sql<number>`1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)})`,
        })
        .from(documents)
        .where(
          and(
            eq(documents.userId, userId),
            subjectId ? eq(documents.subjectId, subjectId) : undefined,
            sql`${documents.embedding} IS NOT NULL`
          ) ?? eq(documents.userId, userId)
        )
        .orderBy(
          desc(
            sql`1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)})`
          )
        )
        .limit(limit);

      // Merge results, avoiding duplicates
      const allResults = [...results];
      const existingIds = new Set(results.map((r) => r.id));

      for (const additionalResult of additionalResults) {
        if (
          !existingIds.has(additionalResult.id) &&
          allResults.length < limit
        ) {
          allResults.push(additionalResult);
        }
      }

      return allResults.map((result) => ({
        ...result,
        metadata: result.metadata as DocumentMetadata | null,
      }));
    }

    return results.map((result) => ({
      ...result,
      metadata: result.metadata as DocumentMetadata | null,
    }));
  } catch (error) {
    console.error("❌ RAG Debug - Error retrieving relevant documents:", error);

    // Final fallback: return some documents without similarity
    try {
      let whereCondition: SQL<unknown> = eq(documents.userId, userId);
      if (subjectId) {
        whereCondition =
          and(whereCondition, eq(documents.subjectId, subjectId)) ??
          whereCondition;
      }

      const fallbackResults = await db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
          fileName: documents.fileName,
          metadata: documents.metadata,
        })
        .from(documents)
        .where(whereCondition)
        .orderBy(desc(documents.createdAt))
        .limit(limit);

      return fallbackResults.map((result) => ({
        ...result,
        similarity: 0.4, // Lower similarity for error fallback
        metadata: result.metadata as DocumentMetadata | null,
      }));
    } catch (fallbackError) {
      console.error("❌ RAG Debug - Even fallback failed:", fallbackError);
      return [];
    }
  }
}

export function formatContextFromDocuments(documents: DocumentChunk[]): string {
  if (documents.length === 0) {
    return "No relevant documents found.";
  }

  const context = documents
    .map((doc, index) => {
      const sourceInfo = doc.fileName
        ? `${doc.title} (${doc.fileName})`
        : doc.title;
      const similarityScore = Math.round(doc.similarity * 100);
      return `Source ${index + 1}: ${sourceInfo} [Relevance: ${similarityScore}%]\n${doc.content}`;
    })
    .join("\n\n---\n\n");

  return `Here are the relevant documents from your study materials:\n\n${context}`;
}

export function extractDocumentIds(documents: DocumentChunk[]): string[] {
  return documents.map((doc) => doc.id);
}

export function getDocumentSummary(documents: DocumentChunk[]): {
  totalDocuments: number;
  averageSimilarity: number;
  sources: Array<{
    id: string;
    title: string;
    fileName: string | null;
    similarity: number;
  }>;
} {
  if (documents.length === 0) {
    return {
      totalDocuments: 0,
      averageSimilarity: 0,
      sources: [],
    };
  }

  const averageSimilarity =
    documents.reduce((sum, doc) => sum + doc.similarity, 0) / documents.length;

  return {
    totalDocuments: documents.length,
    averageSimilarity: Math.round(averageSimilarity * 100) / 100,
    sources: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      similarity: Math.round(doc.similarity * 100) / 100,
    })),
  };
}

// Helper function to validate document metadata
export function validateDocumentMetadata(
  metadata: unknown
): DocumentMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  // Ensure it's a plain object
  try {
    return metadata as DocumentMetadata;
  } catch {
    return null;
  }
}

// Helper function to format document source for display
export function formatDocumentSource(doc: DocumentChunk): string {
  const name = doc.fileName || doc.title;
  const similarity = Math.round(doc.similarity * 100);
  return `${name} (${similarity}% match)`;
}
