"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";

/**
 * Hook for creating a new conversation
 */
export function useCreateConversation() {
  const utils = trpc.useUtils();
  const router = useRouter();

  return trpc.chat.createConversation.useMutation({
    onSuccess: (data) => {
      // Invalidate conversations list
      utils.chat.getConversations.invalidate();

      // Navigate to the new conversation
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
    onSuccess: (_, variables) => {
      // Invalidate conversation messages to refresh the list
      utils.chat.getConversationMessages.invalidate({
        conversationId: variables.conversationId,
      });

      // Update conversations list (to update last activity)
      utils.chat.getConversations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
}

/**
 * Hook for getting conversations list
 */
export function useConversations(subjectId: string) {
  return trpc.chat.getConversations.useQuery(
    { subjectId },
    {
      enabled: !!subjectId,
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
    }
  );
}

/**
 * Hook for getting conversation messages
 */
export function useConversationMessages(conversationId: string) {
  return trpc.chat.getConversationMessages.useQuery(
    { conversationId },
    {
      enabled: !!conversationId,
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: false,
    }
  );
}

/**
 * Hook for deleting conversations
 */
export function useDeleteConversation() {
  const utils = trpc.useUtils();
  const router = useRouter();

  return trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      toast.success("Conversation deleted successfully");

      // Invalidate conversations list
      utils.chat.getConversations.invalidate();

      // Navigate back to chat home
      router.push("/chat");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete conversation");
    },
  });
}

/**
 * Hook for optimistic message updates during sending
 */
export function useOptimisticMessages(conversationId: string) {
  const { data: messagesData } = useConversationMessages(conversationId);
  const [optimisticMessages, setOptimisticMessages] = useState<
    Array<{
      id: string;
      role: string;
      content: string;
      isOptimistic?: boolean;
      isPending?: boolean;
      createdAt?: Date;
    }>
  >([]);

  const messages = useMemo(() => {
    const realMessages = messagesData?.messages || [];
    return [...realMessages, ...optimisticMessages];
  }, [messagesData?.messages, optimisticMessages]);

  const addOptimisticMessage = useCallback((content: string) => {
    const optimisticId = `optimistic-${Date.now()}`;
    const now = new Date();

    setOptimisticMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        role: "user",
        content,
        isOptimistic: true,
        createdAt: now,
      },
      {
        id: `${optimisticId}-assistant`,
        role: "assistant",
        content: "",
        isOptimistic: true,
        isPending: true,
        createdAt: new Date(now.getTime() + 1), // Ensure assistant message is after user message
      },
    ]);
    return optimisticId;
  }, []);

  const clearOptimisticMessages = useCallback(() => {
    setOptimisticMessages([]);
  }, []);

  const updateOptimisticMessage = useCallback((id: string, content: string) => {
    setOptimisticMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, content, isPending: false } : msg
      )
    );
  }, []);

  return {
    messages,
    addOptimisticMessage,
    clearOptimisticMessages,
    updateOptimisticMessage,
  };
}

/**
 * Hook for managing chat input state
 */
export function useChatInput() {
  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const clearInput = useCallback(() => {
    setInput("");
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  return {
    input,
    setInput: handleInputChange,
    clearInput,
    isComposing,
    handleCompositionStart,
    handleCompositionEnd,
  };
}

/**
 * Hook for managing conversation state and actions
 */
export function useConversationManager(subjectId: string) {
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const deleteConversation = useDeleteConversation();
  const { data: conversationsData } = useConversations(subjectId);

  const startNewConversation = useCallback(
    async (firstMessage: string, title?: string) => {
      return await createConversation.mutateAsync({
        subjectId,
        firstMessage,
        title,
      });
    },
    [createConversation, subjectId]
  );

  const sendMessageToConversation = useCallback(
    async (conversationId: string, content: string) => {
      return await sendMessage.mutateAsync({
        conversationId,
        content,
      });
    },
    [sendMessage]
  );

  const removeConversation = useCallback(
    async (conversationId: string) => {
      return await deleteConversation.mutateAsync({
        conversationId,
      });
    },
    [deleteConversation]
  );

  return {
    conversations: conversationsData?.conversations || [],
    startNewConversation,
    sendMessageToConversation,
    removeConversation,
    isCreating: createConversation.isPending,
    isSending: sendMessage.isPending,
    isDeleting: deleteConversation.isPending,
  };
}

/**
 * Hook for managing source attribution display
 */
export function useSourceAttribution() {
  const [showSources, setShowSources] = useState(false);

  const toggleSources = useCallback(() => {
    setShowSources((prev) => !prev);
  }, []);

  const enableSources = useCallback(() => {
    setShowSources(true);
  }, []);

  const disableSources = useCallback(() => {
    setShowSources(false);
  }, []);

  return {
    showSources,
    toggleSources,
    enableSources,
    disableSources,
  };
}
