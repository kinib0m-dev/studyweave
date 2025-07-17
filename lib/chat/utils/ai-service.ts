import { generateObject } from "ai";
import { gemini } from "@/lib/utils/google";

import {
  structuredResponseSchema,
  StructuredResponse,
  ResponseSegment,
} from "../validation/chat-schema";
import { DocumentChunk, formatContextFromDocuments } from "@/lib/utils/rag";

export interface ChatResponse {
  structuredContent: StructuredResponse;
  tokenCount?: number;
}

export function createAntiHallucinationSystemPrompt(
  context: string,
  documents: DocumentChunk[]
): string {
  const documentList = documents
    .map(
      (doc, index) => `Document ${index + 1}: "${doc.title}" (ID: ${doc.id})`
    )
    .join("\n");

  return `You are StudyWeave AI, an intelligent study assistant. Your primary goal is to help students learn using ONLY their uploaded study materials.

CRITICAL INSTRUCTIONS FOR ANTI-HALLUCINATION:
1. You MUST prioritize information from the provided context over your general knowledge
2. When answering, break your response into sentences
3. For EACH sentence, you must identify if it comes from the uploaded files or is your own reasoning
4. If a sentence contains information from the files, specify which document it came from
5. Aim for AT LEAST 80% of your response to be based on the provided files
6. When you add reasoning or explanations not directly in the files, clearly mark them as "generated"
7. Be extremely conservative - if you're not sure if information came from the files, mark it as "generated"

Available Documents:
${documentList}

Context from user's study materials:
${context}

RESPONSE FORMAT REQUIREMENTS:
- Break your response into logical sentences
- For each sentence, determine if it's "from_file" or "generated"
- If "from_file", specify the exact source document ID and title
- Provide a confidence score (0-1) for each attribution
- Prioritize accuracy over length - it's better to give a shorter response that's well-sourced

Guidelines for good educational responses:
- Provide clear, educational explanations
- Reference specific parts of the uploaded materials when possible
- If information is missing from the uploaded materials, clearly state this
- Encourage critical thinking by connecting concepts from the materials
- Ask follow-up questions when appropriate`;
}

export async function generateStructuredChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  relevantDocuments: DocumentChunk[]
): Promise<ChatResponse> {
  try {
    const context = formatContextFromDocuments(relevantDocuments);
    const systemPrompt = createAntiHallucinationSystemPrompt(
      context,
      relevantDocuments
    );

    // Prepare conversation history for the model (convert structured responses back to text)
    const formattedHistory = conversationHistory.map((msg) => {
      if (msg.role === "assistant") {
        // If this is a structured response, convert it back to plain text for context
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.response && Array.isArray(parsed.response)) {
            return {
              role: msg.role,
              content: parsed.response
                .map((segment: ResponseSegment) => segment.text)
                .join(" "),
            };
          }
        } catch {
          // If it's not structured, use as is
        }
      }
      return msg;
    });

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...formattedHistory,
      { role: "user" as const, content: userMessage },
    ];

    const result = await generateObject({
      model: gemini("gemini-2.0-flash-001"),
      schema: structuredResponseSchema,
      messages,
      temperature: 0.3, // Lower temperature for more consistent structured output
    });

    // Validate and enhance the response
    const enhancedResponse = enhanceStructuredResponse(
      result.object,
      relevantDocuments
    );

    return {
      structuredContent: enhancedResponse,
      tokenCount: result.usage?.totalTokens,
    };
  } catch (error) {
    console.error("Error generating structured chat response:", error);

    // Fallback response
    const fallbackResponse: StructuredResponse = {
      response: [
        {
          text: "I apologize, but I'm having trouble processing your request. Please try rephrasing your question.",
          type: "generated",
          sourceDocumentId: null,
          sourceDocumentTitle: null,
          confidence: 1.0,
        },
      ],
      metadata: {
        totalSegments: 1,
        fileBasedSegments: 0,
        generatedSegments: 1,
        fileUsagePercentage: 0,
        averageConfidence: 1.0,
        primarySources: [],
      },
    };

    return {
      structuredContent: fallbackResponse,
    };
  }
}

function enhanceStructuredResponse(
  response: StructuredResponse,
  availableDocuments: DocumentChunk[]
): StructuredResponse {
  // Validate document IDs and fix any inconsistencies
  const validDocumentIds = new Set(availableDocuments.map((doc) => doc.id));
  const documentMap = new Map(availableDocuments.map((doc) => [doc.id, doc]));

  const enhancedSegments = response.response.map((segment) => {
    if (segment.type === "from_file" && segment.sourceDocumentId) {
      // Verify the document ID exists
      if (!validDocumentIds.has(segment.sourceDocumentId)) {
        console.warn(
          `Invalid document ID in response: ${segment.sourceDocumentId}`
        );
        return {
          ...segment,
          type: "generated" as const,
          sourceDocumentId: null,
          sourceDocumentTitle: null,
          confidence: 0.5,
        };
      }

      // Ensure the document title matches
      const doc = documentMap.get(segment.sourceDocumentId);
      if (doc && segment.sourceDocumentTitle !== doc.title) {
        return {
          ...segment,
          sourceDocumentTitle: doc.title,
        };
      }
    }
    return segment;
  });

  // Recalculate metadata
  const fileBasedSegments = enhancedSegments.filter(
    (s) => s.type === "from_file"
  ).length;
  const generatedSegments = enhancedSegments.filter(
    (s) => s.type === "generated"
  ).length;
  const totalSegments = enhancedSegments.length;

  const fileUsagePercentage =
    totalSegments > 0
      ? Math.round((fileBasedSegments / totalSegments) * 100)
      : 0;

  const averageConfidence =
    enhancedSegments.length > 0
      ? enhancedSegments.reduce((sum, s) => sum + s.confidence, 0) /
        enhancedSegments.length
      : 0;

  // Calculate primary sources
  const sourceUsage = new Map<string, { title: string; count: number }>();
  enhancedSegments.forEach((segment) => {
    if (
      segment.type === "from_file" &&
      segment.sourceDocumentId &&
      segment.sourceDocumentTitle
    ) {
      const existing = sourceUsage.get(segment.sourceDocumentId);
      if (existing) {
        existing.count++;
      } else {
        sourceUsage.set(segment.sourceDocumentId, {
          title: segment.sourceDocumentTitle,
          count: 1,
        });
      }
    }
  });

  const primarySources = Array.from(sourceUsage.entries())
    .map(([documentId, { title, count }]) => ({
      documentId,
      documentTitle: title,
      usageCount: count,
    }))
    .sort((a, b) => b.usageCount - a.usageCount);

  return {
    response: enhancedSegments,
    metadata: {
      totalSegments,
      fileBasedSegments,
      generatedSegments,
      fileUsagePercentage,
      averageConfidence,
      primarySources,
    },
  };
}

export function convertStructuredResponseToText(
  structuredResponse: StructuredResponse
): string {
  return structuredResponse.response.map((segment) => segment.text).join(" ");
}

export function generateConversationTitle(firstMessage: string): string {
  const words = firstMessage.split(" ").slice(0, 6);
  let title = words.join(" ");

  if (firstMessage.split(" ").length > 6) {
    title += "...";
  }

  return title || "New Conversation";
}
