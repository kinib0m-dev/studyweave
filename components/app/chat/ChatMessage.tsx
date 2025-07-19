"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Bot, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    sources?: Array<{
      documentId: string;
      documentTitle: string;
      relevance: number;
    }> | null;
    confidence?: number | null;
    tokenCount?: number | null;
    createdAt: Date;
  };
  showSources: boolean;
}

export function ChatMessage({ message, showSources }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Message copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy message");
    }
  };

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Function to render content with source highlighting when toggle is on
  const renderContentWithHighlights = (content: string) => {
    if (
      !showSources ||
      !message.sources ||
      message.sources.length === 0 ||
      isUser
    ) {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="my-3 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="my-3 space-y-1">{children}</ol>
              ),
              li: ({ children }) => <li className="ml-4">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              h1: ({ children }) => (
                <h1 className="text-lg font-semibold mt-4 mb-2 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold mt-3 mb-2 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mt-3 mb-1 first:mt-0">
                  {children}
                </h3>
              ),
            }}
          >
            {content.replace(/\n/g, "\n\n")}
          </ReactMarkdown>
        </div>
      );
    }

    // When sources toggle is on and confidence is high, highlight the content
    const shouldHighlight = message.confidence && message.confidence >= 0.8;

    if (shouldHighlight && message.sources.length > 0) {
      const sourcesText = message.sources
        .map(
          (s) =>
            `${s.documentTitle} (${Math.round(s.relevance * 100)}% relevant)`
        )
        .join(", ");

      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-green-100/90 dark:bg-green-900/40 border-l-4 border-green-500 dark:border-green-400 pl-3 py-2 rounded-r cursor-help shadow-sm">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0 text-green-900 dark:text-green-100">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-3 space-y-1 text-green-900 dark:text-green-100">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-3 space-y-1 text-green-900 dark:text-green-100">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="ml-4 text-green-900 dark:text-green-100">
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-green-900 dark:text-green-100">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-green-900 dark:text-green-100">
                        {children}
                      </em>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-lg font-semibold mt-4 mb-2 first:mt-0 text-green-900 dark:text-green-100">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-semibold mt-3 mb-2 first:mt-0 text-green-900 dark:text-green-100">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mt-3 mb-1 first:mt-0 text-green-900 dark:text-green-100">
                        {children}
                      </h3>
                    ),
                  }}
                >
                  {content.replace(/\n/g, "\n\n")}
                </ReactMarkdown>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <div className="font-medium">
                  High confidence response (
                  {Math.round((message.confidence || 0) * 100)}%)
                </div>
                <div className="text-sm">Sources: {sourcesText}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }

    // Regular content with formatting but no highlighting
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="my-3 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="my-3 space-y-1">{children}</ol>
            ),
            li: ({ children }) => <li className="ml-4">{children}</li>,
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            h1: ({ children }) => (
              <h1 className="text-lg font-semibold mt-4 mb-2 first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold mt-3 mb-2 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold mt-3 mb-1 first:mt-0">
                {children}
              </h3>
            ),
          }}
        >
          {content.replace(/\n/g, "\n\n")}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className={cn("group flex gap-4", isUser && "justify-end")}>
      {/* Avatar - only for assistant */}
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </div>
      )}

      {/* Message Content Container */}
      <div className={cn("max-w-3xl relative", isUser ? "ml-12" : "flex-1")}>
        {/* User messages: simple text, no bubble */}
        {isUser && (
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
        )}

        {/* Assistant messages: bubble with glassmorphism */}
        {isAssistant && (
          <>
            <div className="bg-white/10 backdrop-blur-xl border-white/40 text-card-foreground rounded-lg p-4 shadow-md">
              {renderContentWithHighlights(message.content)}
            </div>

            {/* Copy button - Outside bubble, bottom right */}
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopyMessage}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
