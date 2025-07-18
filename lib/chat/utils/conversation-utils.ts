export class ConversationUtils {
  /**
   * Generate a short conversation title from the first user message
   */
  static generateConversationTitle(firstMessage: string): string {
    // Remove extra whitespace and clean up the message
    const cleaned = firstMessage.trim().replace(/\s+/g, " ");

    // If message is already short, use it as is
    if (cleaned.length <= 50) {
      return cleaned;
    }

    // Try to find a natural break point (sentence end, question mark, etc.)
    const naturalBreaks = [". ", "? ", "! "];
    for (const breakPoint of naturalBreaks) {
      const index = cleaned.indexOf(breakPoint);
      if (index > 20 && index <= 50) {
        return cleaned.substring(0, index + 1).trim();
      }
    }

    // If no natural break, truncate at word boundary
    const words = cleaned.split(" ");
    let title = "";
    for (const word of words) {
      if ((title + " " + word).length > 50) {
        break;
      }
      title += (title ? " " : "") + word;
    }

    return title || cleaned.substring(0, 47) + "...";
  }

  /**
   * Format conversation history for AI context
   */
  static formatConversationHistory(
    messages: Array<{ role: string; content: string }>
  ): Array<{ role: string; content: string }> {
    // Take last 10 messages to avoid context length issues
    const recentMessages = messages.slice(-10);

    return recentMessages.filter((msg) => msg.role !== "system");
  }

  /**
   * Validate that user has access to a conversation
   */
  static validateConversationAccess(
    conversation: { userId: string; subjectId: string },
    currentUserId: string,
    currentSubjectId: string
  ): boolean {
    return (
      conversation.userId === currentUserId &&
      conversation.subjectId === currentSubjectId
    );
  }
}
