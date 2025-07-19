import { db } from "@/db";
import { documents } from "@/db/schema";
import { generateEmbedding } from "@/lib/utils/embedding";
import { sql, desc, eq, and } from "drizzle-orm";

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  fileName: string | null;
  similarity: number;
}

export class RAGService {
  /**
   * Retrieve relevant documents for a user query within a specific subject
   */
  static async retrieveRelevantDocuments(
    query: string,
    userId: string,
    subjectId: string,
    maxResults: number = 6
  ): Promise<RAGDocument[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);

      if (!queryEmbedding) {
        console.warn("Could not generate embedding for query");
        return this.getFallbackDocuments(userId, subjectId, maxResults);
      }

      // Start with a lower, more permissive similarity threshold
      let results: RAGDocument[] = [];

      // Try progressively higher thresholds if we get too many results
      const thresholds = [0.2, 0.3, 0.4, 0.5];

      for (const threshold of thresholds) {
        const rawResults = await db
          .select({
            id: documents.id,
            title: documents.title,
            content: documents.content,
            fileName: documents.fileName,
            similarity:
              sql<number>`1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`.as(
                "similarity"
              ),
          })
          .from(documents)
          .where(
            sql`${documents.userId} = ${userId} 
                AND ${documents.subjectId} = ${subjectId}
                AND ${documents.embedding} IS NOT NULL
                AND (1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)) > ${threshold}`
          )
          .orderBy(
            desc(
              sql`1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`
            )
          )
          .limit(20); // Get more initially to have options

        results = rawResults.map((row) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          fileName: row.fileName,
          similarity: row.similarity,
        }));

        console.log(
          `🔍 RAG Debug - Found ${results.length} documents with threshold ${threshold}`
        );

        // If we have some good results (not too many, not too few), use them
        if (results.length >= 1 && results.length <= 15) {
          break;
        }

        // If we have too many results, try a higher threshold
        if (results.length > 15) {
          continue;
        }

        // If we have very few results with this threshold, try to get more with fallback
        if (
          results.length === 0 &&
          threshold === thresholds[thresholds.length - 1]
        ) {
          console.log(
            "🔍 RAG Debug - No results found even with highest threshold, trying fallback"
          );
          return this.getFallbackDocuments(userId, subjectId, maxResults);
        }
      }

      // If we still have no results, try a hybrid approach
      if (results.length === 0) {
        console.log(
          "🔍 RAG Debug - No semantic matches found, trying hybrid approach"
        );
        return this.getHybridResults(query, userId, subjectId, maxResults);
      }

      // Take the best results
      const finalResults = results.slice(0, maxResults);

      return finalResults;
    } catch (error) {
      console.error(
        "❌ RAG Debug - Error retrieving relevant documents:",
        error
      );
      // Fallback to recent documents if vector search fails completely
      return this.getFallbackDocuments(userId, subjectId, maxResults);
    }
  }

  /**
   * Fallback method to get recent documents when vector search fails
   */
  private static async getFallbackDocuments(
    userId: string,
    subjectId: string,
    maxResults: number
  ): Promise<RAGDocument[]> {
    try {
      const results = await db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
          fileName: documents.fileName,
        })
        .from(documents)
        .where(
          and(eq(documents.userId, userId), eq(documents.subjectId, subjectId))
        )
        .orderBy(desc(documents.createdAt))
        .limit(maxResults);

      return results.map((row) => ({
        ...row,
        similarity: 0.4, // Assign a default similarity for fallback
      }));
    } catch (error) {
      console.error(
        "❌ RAG Debug - Fallback document retrieval failed:",
        error
      );
      return [];
    }
  }

  /**
   * Hybrid approach: combine vector search with keyword matching
   */
  private static async getHybridResults(
    query: string,
    userId: string,
    subjectId: string,
    maxResults: number
  ): Promise<RAGDocument[]> {
    try {
      // Extract key terms from the query for text search
      const queryTerms = query
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length > 2) // Filter out short words
        .slice(0, 5); // Take first 5 meaningful terms

      if (queryTerms.length === 0) {
        return this.getFallbackDocuments(userId, subjectId, maxResults);
      }

      // Build a text search condition
      const searchConditions = queryTerms.map(
        (term) =>
          sql`(LOWER(${documents.content}) LIKE ${`%${term}%`} OR LOWER(${documents.title}) LIKE ${`%${term}%`})`
      );

      const textSearchCondition = sql.join(searchConditions, sql` OR `);

      const results = await db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
          fileName: documents.fileName,
        })
        .from(documents)
        .where(
          and(
            eq(documents.userId, userId),
            eq(documents.subjectId, subjectId),
            textSearchCondition
          )
        )
        .orderBy(desc(documents.createdAt))
        .limit(maxResults);

      return results.map((row) => ({
        ...row,
        similarity: 0.3, // Lower similarity for keyword matches
      }));
    } catch (error) {
      console.error("❌ RAG Debug - Hybrid search failed:", error);
      return this.getFallbackDocuments(userId, subjectId, maxResults);
    }
  }

  /**
   * Format documents for AI context
   */
  static formatDocumentsForContext(documents: RAGDocument[]): string {
    if (documents.length === 0) {
      return "No relevant course materials found for this query.";
    }

    return documents
      .map((doc, index) => {
        const source = doc.fileName || doc.title;
        return `Document ${index + 1} (${source}):
${doc.content.substring(0, 2000)}${doc.content.length > 2000 ? "..." : ""}

---`;
      })
      .join("\n\n");
  }

  /**
   * Create document metadata for source attribution
   */
  static createDocumentMetadata(documents: RAGDocument[]) {
    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      similarity: doc.similarity,
    }));
  }
}
