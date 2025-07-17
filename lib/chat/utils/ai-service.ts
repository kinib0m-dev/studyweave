import { generateObject, streamObject } from "ai";
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

export interface StreamingChatResponse {
  stream: AsyncIterable<Partial<StructuredResponse>>;
  finalResponse: Promise<StructuredResponse>;
}

export function createSystemPrompt(
  context: string,
  documents: DocumentChunk[]
): string {
  const documentList = documents
    .map(
      (doc, index) => `Document ${index + 1}: "${doc.title}" (ID: ${doc.id})`
    )
    .join("\n");

  return `You are StudyWeave AI, an intelligent study assistant designed to help students learn effectively. You have access to both the user's uploaded study materials and your own knowledge base.

Available Documents:
${documentList}

Context from user's study materials:
${context}

RESPONSE GUIDELINES:
- Provide comprehensive, educational responses that help students understand concepts
- Use clear explanations with examples when appropriate
- Structure your response with bullet points, lists, or numbered steps when it improves clarity
- Support learning by connecting concepts and encouraging critical thinking
- Use both document content and your knowledge to give the best possible answer
- When you can answer with more detail or context, please do so
- If the user asks for more details, provide them from both your knowledge and the documents

SOURCE ATTRIBUTION (ALWAYS REQUIRED):
1. Break your response into logical segments (sentences, bullet points, or paragraphs)
2. For EACH segment, identify if it comes primarily from "from_file" or is "generated" (your knowledge)
3. If from files, specify the exact source document ID and title
4. Provide confidence scores (0-1) for each attribution
5. When providing additional context or explanations beyond the files, mark them as "generated"
6. Use structured formatting like lists, bullet points, or numbered steps when helpful

RESPONSE FORMAT:
- Break response into logical segments
- Each segment must be tagged as "from_file" or "generated"
- Include confidence scores for attribution accuracy
- Make responses educational, comprehensive, and well-structured
- Don't limit yourself to only document content - enhance with your knowledge when helpful`;
}

export async function generateStructuredChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  relevantDocuments: DocumentChunk[]
): Promise<ChatResponse> {
  try {
    const context = formatContextFromDocuments(relevantDocuments);
    const systemPrompt = createSystemPrompt(context, relevantDocuments);

    // Prepare conversation history
    const formattedHistory = conversationHistory.map((msg) => {
      if (msg.role === "assistant") {
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
          // Use as is if not structured
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
      temperature: 0.4,
    });

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

    // Try fallback with older model
    try {
      console.log("Attempting fallback with Gemini 1.5 Flash...");
      return await generateWithFallbackModel(
        userMessage,
        conversationHistory,
        relevantDocuments
      );
    } catch (fallbackError) {
      console.error("Fallback model also failed:", fallbackError);
      return createFallbackResponse(userMessage, relevantDocuments);
    }
  }
}

async function generateWithFallbackModel(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  relevantDocuments: DocumentChunk[]
): Promise<ChatResponse> {
  const context = formatContextFromDocuments(relevantDocuments);
  const systemPrompt = createSystemPrompt(context, relevantDocuments);

  // Prepare conversation history
  const formattedHistory = conversationHistory.map((msg) => {
    if (msg.role === "assistant") {
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
        // Use as is if not structured
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
    model: gemini("gemini-1.5-flash"), // Older, more stable model
    schema: structuredResponseSchema,
    messages,
    temperature: 0.4,
  });

  const enhancedResponse = enhanceStructuredResponse(
    result.object,
    relevantDocuments
  );

  return {
    structuredContent: enhancedResponse,
    tokenCount: result.usage?.totalTokens,
  };
}

export async function generateStreamingChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  relevantDocuments: DocumentChunk[]
): Promise<StreamingChatResponse> {
  const context = formatContextFromDocuments(relevantDocuments);
  const systemPrompt = createSystemPrompt(context, relevantDocuments);

  const formattedHistory = conversationHistory.map((msg) => {
    if (msg.role === "assistant") {
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
        // Use as is if not structured
      }
    }
    return msg;
  });

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...formattedHistory,
    { role: "user" as const, content: userMessage },
  ];

  const finalResponsePromise = (async () => {
    try {
      const { object } = await streamObject({
        model: gemini("gemini-2.0-flash-001"),
        schema: structuredResponseSchema,
        messages,
        temperature: 0.4,
      });

      const finalObject = await object;
      return enhanceStructuredResponse(finalObject, relevantDocuments);
    } catch (error) {
      console.error("Error in streaming response:", error);

      // Try fallback with older model
      try {
        console.log("Streaming fallback with Gemini 1.5 Flash...");
        const { object } = await streamObject({
          model: gemini("gemini-1.5-flash"),
          schema: structuredResponseSchema,
          messages,
          temperature: 0.4,
        });

        const finalObject = await object;
        return enhanceStructuredResponse(finalObject, relevantDocuments);
      } catch (fallbackError) {
        console.error("Streaming fallback also failed:", fallbackError);
        const fallback = createFallbackResponse(userMessage, relevantDocuments);
        return fallback.structuredContent;
      }
    }
  })();

  // Create async iterable for streaming
  const streamIterable = async function* () {
    try {
      const { partialObjectStream } = await streamObject({
        model: gemini("gemini-2.0-flash-001"),
        schema: structuredResponseSchema,
        messages,
        temperature: 0.4,
      });

      for await (const partialObject of partialObjectStream) {
        yield partialObject as Partial<StructuredResponse>;
      }
    } catch (error) {
      console.error("Error in stream iteration:", error);

      // Try fallback streaming
      try {
        console.log("Fallback streaming with Gemini 1.5 Flash...");
        const { partialObjectStream } = await streamObject({
          model: gemini("gemini-1.5-flash"),
          schema: structuredResponseSchema,
          messages,
          temperature: 0.4,
        });

        for await (const partialObject of partialObjectStream) {
          yield partialObject as Partial<StructuredResponse>;
        }
      } catch (fallbackError) {
        console.error("Fallback streaming also failed:", fallbackError);
        // Yield fallback response
        const fallback = createFallbackResponse(userMessage, relevantDocuments);
        yield fallback.structuredContent;
      }
    }
  };

  return {
    stream: streamIterable(),
    finalResponse: finalResponsePromise,
  };
}

function enhanceStructuredResponse(
  response: StructuredResponse,
  availableDocuments: DocumentChunk[]
): StructuredResponse {
  const validDocumentIds = new Set(availableDocuments.map((doc) => doc.id));
  const documentMap = new Map(availableDocuments.map((doc) => [doc.id, doc]));

  const enhancedSegments = response.response.map((segment) => {
    if (segment.type === "from_file" && segment.sourceDocumentId) {
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

function createFallbackResponse(
  userMessage: string,
  relevantDocuments: DocumentChunk[]
): ChatResponse {
  // Create a more helpful fallback response based on available documents
  const hasDocuments = relevantDocuments.length > 0;

  let responseText =
    "I apologize, but I'm experiencing temporary technical difficulties. ";

  if (hasDocuments) {
    const docTitles = relevantDocuments
      .slice(0, 3)
      .map((doc) => doc.title)
      .join(", ");
    responseText += `However, I found relevant information in your documents: ${docTitles}. `;
    responseText +=
      "Please try asking your question again in a moment, or try rephrasing it.";
  } else {
    responseText +=
      "It appears you haven't uploaded any study materials yet. Please upload your notes, slides, or textbooks to get personalized assistance.";
  }

  const fallbackResponse: StructuredResponse = {
    response: [
      {
        text: responseText,
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
