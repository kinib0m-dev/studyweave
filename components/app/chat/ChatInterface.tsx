"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  FileText,
  Brain,
  TrendingUp,
} from "lucide-react";
import { useConversationWithMessages } from "@/lib/chat/hooks/use-chat";
import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { getChatPreferences } from "@/lib/chat/utils/preferences";

interface ChatInterfaceProps {
  conversationId: string;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const preferences = getChatPreferences();

  const { data, isLoading, error, refetch } =
    useConversationWithMessages(conversationId);

  const conversation = data?.conversation;
  const messages = conversation?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages.length]);

  const handleMessageSent = () => {
    // Scroll to bottom after sending a message
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Failed to load conversation
            </h3>
            <p className="text-slate-400 mb-4">
              There was an error loading this conversation. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="h-12 w-12 text-slate-400 mx-auto" />
          <p className="text-slate-400">Conversation not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-700/50 bg-slate-800/30 p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-slate-200 truncate">
              {conversation.title}
            </h1>
            {conversation.description && (
              <p className="text-sm text-slate-400 mt-1 truncate">
                {conversation.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {preferences.antiHallucinationEnabled ? (
              <Badge
                variant="outline"
                className="bg-emerald-900/30 text-emerald-300 border-emerald-700/50"
              >
                <Brain className="h-3 w-3 mr-1" />
                Anti-hallucination ON
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-red-900/30 text-red-300 border-red-700/50"
              >
                <Brain className="h-3 w-3 mr-1" />
                Anti-hallucination OFF
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="p-4">
            {messages.length === 0 ? (
              <ChatWelcome conversationTitle={conversation.title} />
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message) => {
                  let isStructured = false;
                  try {
                    const parsed = JSON.parse(message.content);
                    isStructured =
                      parsed.response && Array.isArray(parsed.response);
                  } catch {
                    // Not structured
                  }

                  const messageSources = Array.isArray(message.sources)
                    ? message.sources
                    : undefined;

                  return (
                    <Message
                      key={message.id}
                      id={message.id}
                      role={message.role}
                      content={message.content}
                      createdAt={message.createdAt}
                      isStructured={isStructured}
                      sources={messageSources}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <ChatInput
          conversationId={conversationId}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
}

interface ChatWelcomeProps {
  conversationTitle: string;
}

function ChatWelcome({ conversationTitle }: ChatWelcomeProps) {
  const preferences = getChatPreferences();

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="h-8 w-8 text-blue-400" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-200 mb-2">
              Welcome to {conversationTitle}
            </h2>
            <p className="text-slate-400 text-lg">
              Ask me anything about your uploaded study materials
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 text-left">
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-slate-200">Document-Based</h3>
            </div>
            <p className="text-sm text-slate-400">
              Answers are primarily based on your uploaded study materials
            </p>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-slate-200">AI-Enhanced</h3>
            </div>
            <p className="text-sm text-slate-400">
              Combines document insights with AI knowledge for comprehensive
              answers
            </p>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <h3 className="font-semibold text-slate-200">
                Anti-Hallucination
              </h3>
            </div>
            <p className="text-sm text-slate-400">
              {preferences.antiHallucinationEnabled
                ? "Enabled - sources are clearly marked"
                : "Disabled - AI knowledge is freely used"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
