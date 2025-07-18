import { GoogleGenerativeAI } from "@google/generative-ai";
import { RAGDocument } from "./rag-service";
import { aiResponseSchema } from "../validation/chat-schemas";

export interface AIServiceResponse {
  content: string;
  sourceAttribution: {
    segments: Array<{
      content: string;
      sources: Array<{
        documentId: string;
        documentTitle: string;
        confidence: number;
      }>;
      overallConfidence: number;
    }>;
  };
  tokenCount?: number;
}

export class AIService {
  private static genAI = process.env.GOOGLE_AI_API_KEY
    ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
    : null;

  /**
   * Generate response using Gemini 2.0 Flash with fallback to 1.5 Pro or mock response
   */
  static async generateResponse(
    userMessage: string,
    relevantDocuments: RAGDocument[],
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<AIServiceResponse> {
    // Development mode - return mock response if no API key
    if (
      !process.env.GOOGLE_AI_API_KEY ||
      process.env.NODE_ENV === "development"
    ) {
      console.log("Using mock AI response for development");
      return this.generateMockResponse();
    }

    const systemPrompt = this.createSystemPrompt(relevantDocuments);
    const userPrompt = this.createUserPrompt(userMessage);

    // Try Gemini 2.0 Flash first
    try {
      return await this.callGeminiModel(
        "gemini-2.0-flash-exp",
        systemPrompt,
        userPrompt,
        conversationHistory
      );
    } catch (error) {
      console.warn("Gemini 2.0 Flash failed, falling back to 1.5 Pro:", error);

      // Fallback to Gemini 1.5 Pro
      try {
        return await this.callGeminiModel(
          "gemini-1.5-pro",
          systemPrompt,
          userPrompt,
          conversationHistory
        );
      } catch (fallbackError) {
        console.error(
          "Both Gemini models failed, using mock response:",
          fallbackError
        );
        return this.generateMockResponse();
      }
    }
  }

  /**
   * Generate mock response for server errors
   */
  private static generateMockResponse(): AIServiceResponse {
    const content = "There is a server error, try again shortly.";

    return {
      content,
      sourceAttribution: {
        segments: [
          {
            content,
            sources: [],
            overallConfidence: 0,
          },
        ],
      },
      tokenCount: this.estimateTokenCount(content),
    };
  }

  private static async callGeminiModel(
    modelName: string,
    systemPrompt: string,
    userPrompt: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<AIServiceResponse> {
    if (!this.genAI) {
      throw new Error("Google AI not initialized");
    }

    const model = this.genAI.getGenerativeModel({ model: modelName });

    // Build conversation context
    const messages = [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [
          {
            text: "I understand. I will provide responses based primarily on the provided course materials while indicating source confidence for each segment of my response. I'll use my general knowledge only to explain or clarify concepts when the course materials don't provide sufficient detail.",
          },
        ],
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: [{ text: userPrompt }] },
    ];

    const chat = model.startChat({
      history: messages.slice(0, -1),
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(userPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse the structured response
    return this.parseAIResponse(text);
  }

  private static createSystemPrompt(relevantDocuments: RAGDocument[]): string {
    const documentsContext =
      relevantDocuments.length > 0
        ? `COURSE MATERIALS:\n${relevantDocuments
            .map(
              (doc, index) =>
                `Document ${index + 1} (ID: ${doc.id}, Title: "${doc.title}"):
${doc.content.substring(0, 1500)}${doc.content.length > 1500 ? "..." : ""}

---`
            )
            .join("\n\n")}`
        : "No specific course materials found for this query.";

    return `You are StudyWeave, an intelligent study assistant. Your primary role is to help students understand their course materials by providing clear, educational responses.

ANTI-HALLUCINATION SYSTEM:
You must respond with a structured JSON format that includes source attribution for each segment of your response. For every segment of your answer, you must indicate:
1. The content of the segment
2. Which source documents support that content (if any)
3. A confidence score (0-100) indicating how well the source supports that segment

RESPONSE FORMAT:
Return your response as a JSON object with this exact structure:
{
  "content": "Your full response in markdown format",
  "sourceAttribution": {
    "segments": [
      {
        "content": "First segment of your response",
        "sources": [
          {
            "documentId": "document_id_here",
            "documentTitle": "Document title",
            "confidence": 85
          }
        ],
        "overallConfidence": 85
      }
    ]
  }
}

CONFIDENCE SCORING GUIDELINES:
- 80-100%: Content directly found in course materials with clear evidence
- 60-79%: Content partially supported by course materials but requires some interpretation
- 40-59%: Content inferred from course materials but not explicitly stated
- 20-39%: Content primarily from general knowledge with minimal course material support
- 0-19%: Content entirely from general knowledge with no course material support

INSTRUCTIONS:
1. Base your response primarily on the provided course materials
2. Use your general knowledge to explain, clarify, or provide examples when course materials are insufficient
3. Always be educational and help the student understand concepts deeply
4. Break your response into logical segments for source attribution
5. Be honest about confidence levels - don't claim high confidence for general knowledge

${documentsContext}`;
  }

  private static createUserPrompt(userMessage: string): string {
    return `Student Question: ${userMessage}

Please provide a helpful, educational response following the anti-hallucination format specified in the system prompt. Remember to structure your response as JSON with proper source attribution.`;
  }

  private static parseAIResponse(text: string): AIServiceResponse {
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      const jsonMatch =
        text.match(/```json\n([\s\S]*?)\n```/) ||
        text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      const parsed = JSON.parse(jsonText);

      // Validate the response structure using Zod schema
      const validatedResponse = aiResponseSchema.parse(parsed);

      return {
        content: validatedResponse.content,
        sourceAttribution: validatedResponse.sourceAttribution,
        tokenCount: this.estimateTokenCount(validatedResponse.content),
      };
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      console.error("Raw response:", text);

      // Fallback response
      return {
        content: text,
        sourceAttribution: {
          segments: [
            {
              content: text,
              sources: [],
              overallConfidence: 0,
            },
          ],
        },
        tokenCount: this.estimateTokenCount(text),
      };
    }
  }

  private static estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
