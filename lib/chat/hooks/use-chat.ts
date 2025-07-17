"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { generateStreamingChatResponse } from "../utils/ai-service";
import { retrieveRelevantDocuments } from "@/lib/utils/rag";

/**
 * Hook for fetching conversations
 */
export function useConversations(params: {
  subjectId?: string;
  limit?: number;
  offset?: number;
}) {
  return trpc.chat.getConversations.useQuery(params);
}

/**
 * Hook for fetching a single conversation with messages
 */
export function useConversationWithMessages(conversationId: string) {
  return trpc.chat.getConversationWithMessages.useQuery({ conversationId });
}

/**
 * Hook for creating a new conversation
 */
export function useCreateConversation() {
  const router = useRouter();
  const utils = trpc.useUtils();

  return trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      toast.success("Conversation created successfully");
      utils.chat.getConversations.invalidate();
      router.push(`/chat/${data.conversation.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create conversation");
    },
  });
}

/**
 * Hook for sending messages
 */
export function useSendMessage() {
  const utils = trpc.useUtils();

  return trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      // Invalidate and refetch conversation data
      utils.chat.getConversationWithMessages.invalidate();
      utils.chat.getConversations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
}

/**
 * Hook for streaming messages (client-side streaming)
 */
export function useStreamingMessage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const utils = trpc.useUtils();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  const sendStreamingMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      subjectId?: string,
      userId?: string
    ) => {
      if (!userId) return;

      setIsStreaming(true);
      setStreamingContent("");

      try {
        // Get conversation history
        const conversationData =
          await utils.chat.getConversationWithMessages.fetch({
            conversationId,
          });

        const conversationHistory = conversationData.conversation.messages
          .slice(-10)
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));

        // Retrieve relevant documents
        const relevantDocuments = await retrieveRelevantDocuments(
          content,
          userId,
          subjectId,
          12
        );

        // Start streaming
        const { stream, finalResponse } = await generateStreamingChatResponse(
          content,
          conversationHistory,
          relevantDocuments
        );

        let accumulatedContent = "";

        // Process the async iterable stream
        for await (const partialResponse of stream) {
          if (partialResponse && partialResponse.response) {
            accumulatedContent = partialResponse.response
              .map((segment) => segment?.text || "")
              .filter(Boolean)
              .join(" ");
            setStreamingContent(accumulatedContent);
          }
        }

        // Get final response and save to database
        const finalStructuredResponse = await finalResponse;

        // Save the final structured response to the database
        await sendMessageMutation.mutateAsync({
          conversationId,
          content,
          subjectId,
        });

        // Invalidate queries to refresh the UI
        utils.chat.getConversationWithMessages.invalidate();
        utils.chat.getConversations.invalidate();

        setIsStreaming(false);
        setStreamingContent("");

        return finalStructuredResponse;
      } catch (error) {
        console.error("Streaming error:", error);
        setIsStreaming(false);
        setStreamingContent("");
        toast.error("Failed to stream message");
        throw error;
      }
    },
    [utils, sendMessageMutation]
  );

  return {
    sendStreamingMessage,
    isStreaming,
    streamingContent,
  };
}

/**
 * Hook for updating conversations
 */
export function useUpdateConversation() {
  const utils = trpc.useUtils();

  return trpc.chat.updateConversation.useMutation({
    onSuccess: () => {
      toast.success("Conversation updated successfully");
      utils.chat.getConversations.invalidate();
      utils.chat.getConversationWithMessages.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update conversation");
    },
  });
}

/**
 * Hook for deleting conversations
 */
export function useDeleteConversation() {
  const router = useRouter();
  const utils = trpc.useUtils();

  return trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      toast.success("Conversation deleted successfully");
      utils.chat.getConversations.invalidate();
      router.push("/chat");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete conversation");
    },
  });
}

/**
 * Hook for optimistic message updates (for better UX)
 */
export function useOptimisticChat(conversationId: string) {
  const { data: conversationData } =
    useConversationWithMessages(conversationId);
  const sendMessage = useSendMessage();
  const { sendStreamingMessage, isStreaming, streamingContent } =
    useStreamingMessage();

  const sendOptimisticMessage = async (
    content: string,
    subjectId?: string,
    useStreaming = false
  ) => {
    if (useStreaming) {
      return sendStreamingMessage(conversationId, content, subjectId);
    } else {
      return sendMessage.mutateAsync({
        conversationId,
        content,
        subjectId,
      });
    }
  };

  return {
    conversation: conversationData?.conversation,
    messages: conversationData?.conversation?.messages || [],
    sendMessage: sendOptimisticMessage,
    isLoading: sendMessage.isPending || isStreaming,
    error: sendMessage.error,
    streamingContent,
    isStreaming,
  };
}
