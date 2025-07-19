import { generateObject } from "ai";
import { gemini } from "@/lib/utils/google";
import {
  studyWeaveResponseSchema,
  type AIServiceResponse,
} from "../validation/chat-schemas";
import { type RAGDocument } from "./rag-service";

export class AIService {
  /**
   * Generate response using AI SDK with Gemini models and fallback chain
   */
  static async generateResponse(
    userMessage: string,
    relevantDocuments: RAGDocument[],
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<AIServiceResponse> {
    const systemPrompt = this.createSystemPrompt(relevantDocuments);

    // Prepare conversation history for AI with proper types
    const formattedHistory = conversationHistory.map((msg) => ({
      role: (msg.role === "user" ? "user" : "assistant") as
        | "user"
        | "assistant",
      content: msg.content,
    }));

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...formattedHistory,
      { role: "user" as const, content: userMessage },
    ];

    // Try Gemini 2.0 Flash first
    try {
      console.log("Attempting Gemini 2.0 Flash...");
      const result = await generateObject({
        model: gemini("gemini-2.0-flash-001"),
        schema: studyWeaveResponseSchema,
        messages,
        temperature: 0.7,
      });

      return this.formatResponse(result.object, result.usage?.totalTokens);
    } catch (error) {
      console.warn(
        "Gemini 2.0 Flash failed, falling back to 1.5 Flash:",
        error
      );

      // Fallback to Gemini 1.5 Flash
      try {
        const result = await generateObject({
          model: gemini("gemini-1.5-flash"),
          schema: studyWeaveResponseSchema,
          messages,
          temperature: 0.7,
        });

        return this.formatResponse(result.object, result.usage?.totalTokens);
      } catch (fallbackError) {
        console.warn(
          "Gemini 1.5 Flash failed, falling back to 1.5 Pro:",
          fallbackError
        );

        // Fallback to Gemini 1.5 Pro
        try {
          const result = await generateObject({
            model: gemini("gemini-1.5-pro"),
            schema: studyWeaveResponseSchema,
            messages,
            temperature: 0.7,
          });

          return this.formatResponse(result.object, result.usage?.totalTokens);
        } catch (finalError) {
          console.error(
            "All models failed, using fallback response:",
            finalError
          );
          return this.createFallbackResponse(userMessage, relevantDocuments);
        }
      }
    }
  }

  /**
   * Create system prompt for StudyWeave AI
   */
  private static createSystemPrompt(relevantDocuments: RAGDocument[]): string {
    const documentsContext =
      relevantDocuments.length > 0
        ? `COURSE MATERIALS:\n${relevantDocuments
            .map(
              (doc, index) =>
                `Document ${index + 1} (ID: ${doc.id}, Title: "${doc.title}", Source: ${doc.fileName || "Unknown"}):
${doc.content.substring(0, 1500)}${doc.content.length > 1500 ? "..." : ""}

---`
            )
            .join("\n\n")}`
        : "No specific course materials found for this query.";

    return `You are StudyWeave AI, an intelligent study assistant designed to help students learn effectively. You have access to the user's uploaded study materials and your own knowledge base.

RESPONSE GUIDELINES:
- Provide comprehensive, educational responses that help students understand concepts
- Use clear explanations with examples when appropriate
- Structure your response with proper formatting - use line breaks, bullet points, and numbered lists
- Support learning by connecting concepts and encouraging critical thinking
- Use both document content and your knowledge to give the best possible answer
- When you can answer with more detail or context, please do so
- Always be educational and focus on helping the student learn

FORMATTING REQUIREMENTS:
- Use line breaks to separate different concepts or sections
- Use **bold** for important terms or concepts  
- Use bullet points or numbered lists when listing items
- Add line breaks between paragraphs for better readability
- Structure your response clearly with headers when appropriate

SOURCE ATTRIBUTION:
- When using information from the provided documents, include those documents in your sources array
- Set relevance scores (0-1) based on how much each source contributed to your answer
- You can use your general knowledge to explain concepts, but prioritize course materials when available
- Be honest about your confidence level (0-1) in the overall response

INSTRUCTIONS:
1. Analyze the user's question and the provided course materials
2. Generate a helpful, educational response using both sources and your knowledge
3. Format the response with proper line breaks and structure for readability
4. List the documents that contributed to your answer with relevance scores
5. Provide an overall confidence score for your response

${documentsContext}`;
  }

  /**
   * Format the AI response object into our standard interface
   */
  private static formatResponse(
    aiResponse: {
      content: string;
      sources: Array<{
        documentId: string;
        documentTitle: string;
        relevance: number;
      }>;
      confidence: number;
    },
    tokenCount?: number
  ): AIServiceResponse {
    return {
      content: aiResponse.content,
      sources: aiResponse.sources,
      confidence: aiResponse.confidence,
      tokenCount,
    };
  }

  /**
   * Create fallback response when all AI models fail
   */
  private static createFallbackResponse(
    userMessage: string,
    relevantDocuments: RAGDocument[]
  ): AIServiceResponse {
    const hasDocuments = relevantDocuments.length > 0;

    let content =
      "I apologize, but I'm having trouble processing your request at the moment.\n\n";

    if (hasDocuments) {
      const docTitles = relevantDocuments
        .slice(0, 3)
        .map((doc) => doc.fileName || doc.title)
        .join(", ");
      content += `However, I found relevant information in your documents: **${docTitles}**.\n\n`;
      content +=
        "Please try asking your question again in a moment, or try rephrasing it.";
    } else {
      content += "It appears you haven't uploaded any study materials yet.\n\n";
      content +=
        "Please upload your notes, slides, or textbooks to get personalized assistance.";
    }

    return {
      content,
      sources: [],
      confidence: 0.5,
      tokenCount: this.estimateTokenCount(content),
    };
  }

  /**
   * Estimate token count from text length
   */
  private static estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate conversation title from first message
   */
  static generateConversationTitle(firstMessage: string): string {
    const words = firstMessage.split(" ").slice(0, 6);
    let title = words.join(" ");

    if (firstMessage.split(" ").length > 6) {
      title += "...";
    }

    return title || "New Conversation";
  }
}
