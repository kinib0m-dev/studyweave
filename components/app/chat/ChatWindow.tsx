"use client";

import { useRef, useEffect, useMemo } from "react";
import { useCurrentSubject } from "@/lib/subject/hooks/use-current-subject";
import {
  useConversationMessages,
  useConversationManager,
  useChatInput,
} from "@/lib/chat/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "./ChatMessage";

interface ChatWindowProps {
  conversationId: string | null;
  showNewChat: boolean;
  showSources: boolean;
  onConversationCreated: (conversationId: string) => void;
}

export function ChatWindow({
  conversationId,
  showNewChat,
  showSources,
  onConversationCreated,
}: ChatWindowProps) {
  const { subjectId } = useCurrentSubject();
  const { data: messagesData, isLoading: isLoadingMessages } =
    useConversationMessages(conversationId || "");
  const {
    startNewConversation,
    sendMessageToConversation,
    isSending,
    isCreating,
  } = useConversationManager(subjectId!);
  const { input, setInput, clearInput } = useChatInput();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = messagesData?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useMemo(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const messageContent = input.trim();
    clearInput();

    try {
      if (conversationId) {
        // Send message to existing conversation
        await sendMessageToConversation(conversationId, messageContent);
      } else {
        // Create new conversation with first message
        const result = await startNewConversation(messageContent);
        if (result?.conversation?.id) {
          onConversationCreated(result.conversation.id);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setInput(messageContent); // Restore the message on error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isLoading = isLoadingMessages || isSending || isCreating;

  // Empty state for new chat
  if (showNewChat || !conversationId) {
    return (
      <div className="h-full flex flex-col">
        {/* Welcome Message */}
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-2xl mx-4">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                StudyWeave Assistant
              </h2>
              <p className="text-muted-foreground">
                Ask me anything about your course materials. I&apos;ll provide
                accurate answers with source attribution and confidence scores.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">📚 Study Help</h3>
                <p className="text-sm text-muted-foreground">
                  &quot;Explain the key concepts from Chapter 5&quot;
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">🔍 Quick Questions</h3>
                <p className="text-sm text-muted-foreground">
                  &quot;What are the main differences between X and Y?&quot;
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">📝 Test Prep</h3>
                <p className="text-sm text-muted-foreground">
                  &quot;Create practice questions for the upcoming exam&quot;
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">💡 Clarification</h3>
                <p className="text-sm text-muted-foreground">
                  &quot;I don&apos;t understand this formula, can you
                  help?&quot;
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask me anything about your course materials..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[50px] max-h-[120px] resize-none pr-12"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="lg"
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              showSources={showSources}
            />
          ))}

          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Ask a follow-up question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[50px] max-h-[120px] resize-none pr-12"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
