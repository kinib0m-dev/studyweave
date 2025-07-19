"use client";

import { useRef, useEffect } from "react";
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
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 100);
      }
    }
  }, [messages.length]);

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
        await sendMessageToConversation(conversationId, messageContent);
      } else {
        const result = await startNewConversation(messageContent);
        if (result?.conversation?.id) {
          onConversationCreated(result.conversation.id);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setInput(messageContent);
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
        {/* Welcome Message - Takes available space */}
        <div className="flex-1 min-h-0">
          <div className="h-full flex items-center justify-center p-4">
            <Card className="p-8 text-center max-w-2xl">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">
                  StudyWeave Assistant
                </h2>
                <p className="text-muted-foreground">
                  Ask me anything about your course materials. I&apos;ll provide
                  accurate answers with source attribution and confidence
                  scores.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Input Area - Natural height */}
        <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Start a conversation about your study materials..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[50px] max-h-[120px] resize-none"
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
      {/* Messages Area - Takes available space */}
      <div className="flex-1 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="max-w-4xl mx-auto space-y-6 p-4 pb-6">
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
      </div>

      {/* Input Area - Natural height */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Ask a follow-up question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[50px] max-h-[120px] resize-none"
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
