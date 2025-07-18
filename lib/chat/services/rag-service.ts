import { db } from "@/db";
import { documents } from "@/db/schema";
import { generateEmbedding } from "@/lib/utils/embedding";
import { sql, desc } from "drizzle-orm";

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
        return [];
      }

      // Initial similarity threshold
      let similarityThreshold = 0.5;
      let results: RAGDocument[] = [];

      // Adaptive retrieval - adjust threshold if too many results
      for (let attempt = 0; attempt < 3; attempt++) {
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
                AND (1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)) > ${similarityThreshold}`
          )
          .orderBy(
            desc(
              sql`1 - (${documents.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`
            )
          )
          .limit(Math.min(maxResults + 4, 10)); // Get a few extra to account for filtering

        results = rawResults.map((row) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          fileName: row.fileName,
          similarity: row.similarity,
        }));

        // If we have too many results (>10), increase threshold
        if (results.length > 10) {
          similarityThreshold += 0.1;
          continue;
        }

        // If we have a good number, take the top maxResults
        if (results.length <= maxResults) {
          break;
        }

        // If we have between maxResults and 10, take the top maxResults
        results = results.slice(0, maxResults);
        break;
      }

      // Always ensure we get minimum of 3 if available
      const finalResults = results.slice(
        0,
        Math.max(Math.min(results.length, maxResults), 3)
      );

      console.log(
        `RAG retrieved ${finalResults.length} documents with similarity threshold ${similarityThreshold}`
      );

      return finalResults;
    } catch (error) {
      console.error("Error retrieving relevant documents:", error);
      return [];
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
