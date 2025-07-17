"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useState } from "react";

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
 * Hook for streaming messages (server-side streaming via tRPC)
 */
export function useStreamingMessage() {
  const [isStreaming, setIsStreaming] = useState(false);

  // Use the regular sendMessage mutation - streaming should be handled server-side
  const sendMessage = useSendMessage();

  const sendStreamingMessage = async (
    conversationId: string,
    content: string,
    subjectId?: string
  ) => {
    setIsStreaming(true);

    try {
      // Use the server-side tRPC procedure that handles RAG and AI generation
      const result = await sendMessage.mutateAsync({
        conversationId,
        content,
        subjectId,
      });

      setIsStreaming(false);
      return result;
    } catch (error) {
      setIsStreaming(false);
      throw error;
    }
  };

  return {
    sendStreamingMessage,
    isStreaming,
    streamingContent: "", // Remove this if not using client-side streaming
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
  const utils = trpc.useUtils();

  return trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      toast.success("Conversation deleted successfully");
      utils.chat.getConversations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete conversation");
    },
  });
}
