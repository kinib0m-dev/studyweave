"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GetConversationsSchema } from "../validation/chat-schema";

/**
 * Hook for creating conversations
 */
export function useCreateConversation() {
  const utils = trpc.useUtils();
  const router = useRouter();

  return trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      toast.success("Conversation created successfully!");
      utils.chat.getConversations.invalidate();

      // Navigate to the new conversation
      if (data.conversation) {
        router.push(`/chat/${data.conversation.id}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create conversation");
    },
  });
}

/**
 * Hook for fetching conversations
 */
export function useConversations(options?: GetConversationsSchema) {
  return trpc.chat.getConversations.useQuery(options || {}, {
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
}

/**
 * Hook for fetching a conversation with messages
 */
export function useConversationWithMessages(conversationId: string) {
  return trpc.chat.getConversationWithMessages.useQuery(
    { conversationId },
    {
      enabled: !!conversationId,
      staleTime: 10 * 1000, // 10 seconds
      retry: 2,
    }
  );
}

/**
 * Hook for sending messages
 */
export function useSendMessage() {
  const utils = trpc.useUtils();

  return trpc.chat.sendMessage.useMutation({
    onSuccess: (data, variables) => {
      // Invalidate the conversation to refresh messages
      utils.chat.getConversationWithMessages.invalidate({
        conversationId: variables.conversationId,
      });

      // Also invalidate conversations list to update timestamps
      utils.chat.getConversations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
}

/**
 * Hook for updating conversations
 */
export function useUpdateConversation() {
  const utils = trpc.useUtils();

  return trpc.chat.updateConversation.useMutation({
    onSuccess: (data) => {
      toast.success("Conversation updated successfully!");
      utils.chat.getConversations.invalidate();

      if (data.conversation) {
        utils.chat.getConversationWithMessages.invalidate({
          conversationId: data.conversation.id,
        });
      }
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
  const router = useRouter();

  return trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      toast.success("Conversation deleted successfully!");
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

  const sendOptimisticMessage = async (content: string, subjectId?: string) => {
    // You could implement optimistic updates here
    // For now, just use the regular mutation
    return sendMessage.mutateAsync({
      conversationId,
      content,
      subjectId,
    });
  };

  return {
    conversation: conversationData?.conversation,
    messages: conversationData?.conversation?.messages || [],
    sendMessage: sendOptimisticMessage,
    isLoading: sendMessage.isPending,
    error: sendMessage.error,
  };
}
