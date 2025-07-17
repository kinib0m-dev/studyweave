"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Copy, Check, User, Bot, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getChatPreferences,
  ChatPreferences,
} from "@/lib/chat/utils/preferences";
import { StructuredResponse } from "@/lib/chat/validation/chat-schema";
import {
  formatStructuredResponseForUI,
  getFileUsageBadgeClass,
  generateSourceTooltipContent,
} from "@/lib/chat/utils/response-formatter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";

interface MessageProps {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  isStructured?: boolean;
  sources?: string[];
}

export function Message({
  role,
  content,
  createdAt,
  isStructured = false,
  sources,
}: MessageProps) {
  const [copied, setCopied] = useState(false);
  const [preferences, setPreferences] =
    useState<ChatPreferences>(getChatPreferences());

  useEffect(() => {
    const handleStorageChange = () => {
      setPreferences(getChatPreferences());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("chatPreferencesChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("chatPreferencesChanged", handleStorageChange);
    };
  }, []);

  const handleCopy = async () => {
    try {
      let textToCopy = content;

      if (isStructured) {
        try {
          const parsed: StructuredResponse = JSON.parse(content);
          textToCopy = parsed.response.map((segment) => segment.text).join(" ");
        } catch {
          // Use original content if parsing fails
        }
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Message copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy message");
    }
  };

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start gap-3 max-w-[80%]">
          <div className="flex-1">
            <div className="bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-3">
              <div className="text-sm leading-relaxed">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc ml-4 mb-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal ml-4 mb-2">{children}</ol>
                    ),
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="bg-blue-700/50 px-1 py-0.5 rounded text-sm">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
            <div className="flex justify-end mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-600 text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start gap-3 max-w-[90%]">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-slate-700 text-slate-300">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <AssistantMessageContent
            content={content}
            isStructured={isStructured}
            preferences={preferences}
            sources={sources}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300"
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AssistantMessageContentProps {
  content: string;
  isStructured: boolean;
  preferences: ChatPreferences;
  sources?: string[];
}

function AssistantMessageContent({
  content,
  isStructured,
  preferences,
}: AssistantMessageContentProps) {
  // If anti-hallucination is disabled OR content is not structured, show simple format
  if (!isStructured || !preferences.antiHallucinationEnabled) {
    let displayContent = content;
    if (isStructured) {
      try {
        const parsed: StructuredResponse = JSON.parse(content);
        displayContent = parsed.response
          .map((segment) => segment.text)
          .join(" ");
      } catch {
        // If parsing fails, use original content
      }
    }

    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="text-sm leading-relaxed text-slate-200">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-slate-200">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-slate-100">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-slate-300">{children}</em>
              ),
              h1: ({ children }) => (
                <h1 className="text-xl font-bold mb-3 text-slate-100">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold mb-2 text-slate-100">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-medium mb-2 text-slate-100">
                  {children}
                </h3>
              ),
              code: ({ children }) => (
                <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-sm text-slate-200 font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-3 mb-3 overflow-x-auto">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-slate-600 pl-4 italic text-slate-300 mb-3">
                  {children}
                </blockquote>
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Parse structured response for anti-hallucination display
  let structuredResponse: StructuredResponse;
  try {
    structuredResponse = JSON.parse(content);
  } catch {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="text-sm leading-relaxed text-slate-200">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  const formattedSegments = formatStructuredResponseForUI(
    structuredResponse,
    preferences.antiHallucinationEnabled
  );

  const { metadata } = structuredResponse;

  return (
    <div className="space-y-3">
      {/* Main Content */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="text-sm leading-relaxed space-y-2">
          <TooltipProvider>
            {formattedSegments.map((segment) => (
              <Tooltip key={segment.id}>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "inline-block px-1.5 py-0.5 rounded border transition-colors",
                      segment.cssClass
                    )}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <span>{children}</span>,
                        strong: ({ children }) => <strong>{children}</strong>,
                        em: ({ children }) => <em>{children}</em>,
                        code: ({ children }) => (
                          <code className="bg-slate-700/50 px-1 py-0.5 rounded text-xs">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {segment.text}
                    </ReactMarkdown>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{generateSourceTooltipContent(segment)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs">
        <Badge
          variant="outline"
          className={getFileUsageBadgeClass(metadata.fileUsagePercentage)}
        >
          <FileText className="h-3 w-3 mr-1" />
          {metadata.fileUsagePercentage}% from files
        </Badge>

        {metadata.primarySources.length > 0 && (
          <Badge
            variant="outline"
            className="bg-slate-700/30 text-slate-300 border-slate-600/50"
          >
            {metadata.primarySources.length} source
            {metadata.primarySources.length !== 1 ? "s" : ""}
          </Badge>
        )}

        <Badge
          variant="outline"
          className="bg-slate-700/30 text-slate-300 border-slate-600/50"
        >
          {Math.round(metadata.averageConfidence * 100)}% confidence
        </Badge>
      </div>
    </div>
  );
}
