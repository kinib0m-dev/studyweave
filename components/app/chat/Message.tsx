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
import type { Components } from "react-markdown";

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
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (role === "user") {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[80%] space-y-2">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-md px-4 py-3">
            <div className="text-sm leading-relaxed text-slate-200">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-100">
                      {children}
                    </strong>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
            <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
          </div>
        </div>
        <Avatar className="w-8 h-8 bg-blue-600/20 border border-blue-500/30">
          <AvatarFallback>
            <User className="h-4 w-4 text-blue-400" />
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <Avatar className="w-8 h-8 bg-slate-700/50 border border-slate-600/50">
        <AvatarFallback>
          <Bot className="h-4 w-4 text-slate-400" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 max-w-[80%] space-y-2">
        <AssistantMessageContent
          content={content}
          isStructured={isStructured}
          preferences={preferences}
          sources={sources}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
            {sources && sources.length > 0 && (
              <Badge
                variant="outline"
                className="bg-slate-800/50 text-slate-400 border-slate-600/50"
              >
                <FileText className="h-3 w-3 mr-1" />
                {sources.length} source{sources.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2 text-slate-400 hover:text-slate-200"
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
  // Common markdown components for consistent styling
  const markdownComponents: Components = {
    p: ({ children }) => (
      <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>
    ),
    li: ({ children }) => <li className="text-slate-200">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-slate-100">{children}</strong>
    ),
    em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
    h1: ({ children }) => (
      <h1 className="text-xl font-bold mb-3 text-slate-100">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-semibold mb-2 text-slate-100">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-medium mb-2 text-slate-100">{children}</h3>
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
  };

  // If anti-hallucination is disabled OR content is not structured, show unified simple format
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
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-md">
        <div className="px-4 py-3">
          <div className="text-sm text-slate-200">
            <ReactMarkdown components={markdownComponents}>
              {displayContent}
            </ReactMarkdown>
          </div>
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
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-md">
        <div className="px-4 py-3">
          <div className="text-sm text-slate-200">
            <ReactMarkdown components={markdownComponents}>
              {content}
            </ReactMarkdown>
          </div>
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
      {/* Main Content with Enhanced Structured Display */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-md">
        <div className="px-4 py-3">
          <div className="text-sm leading-relaxed space-y-2">
            <TooltipProvider>
              {formattedSegments.map((segment) => (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "inline-block px-2 py-1 rounded-md border transition-all duration-200 hover:scale-[1.02]",
                        segment.cssClass,
                        "cursor-help"
                      )}
                    >
                      <ReactMarkdown
                        components={{
                          ...markdownComponents,
                          p: ({ children }) => <span>{children}</span>,
                        }}
                      >
                        {segment.text}
                      </ReactMarkdown>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs bg-slate-900 border-slate-700"
                  >
                    <p className="text-xs">
                      {generateSourceTooltipContent(segment)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>

        {/* Enhanced Metadata Footer */}
        <div className="border-t border-slate-700/50 px-4 py-2 bg-slate-900/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={getFileUsageBadgeClass(metadata.fileUsagePercentage)}
              >
                {metadata.fileUsagePercentage}% from files
              </Badge>

              <span className="text-slate-500">
                {metadata.totalSegments} segment
                {metadata.totalSegments !== 1 ? "s" : ""}
              </span>

              <span className="text-slate-500">
                {Math.round(metadata.averageConfidence * 100)}% confidence
              </span>
            </div>

            {metadata.primarySources && metadata.primarySources.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-slate-500">
                  {metadata.primarySources.length} source
                  {metadata.primarySources.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Sources List (when anti-hallucination is enabled) */}
      {metadata.primarySources && metadata.primarySources.length > 0 && (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3">
          <h4 className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Primary Sources
          </h4>
          <div className="space-y-1">
            {metadata.primarySources.slice(0, 3).map((source) => (
              <div
                key={source.documentId}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-slate-400 truncate max-w-[200px]">
                  {source.documentTitle}
                </span>
                <Badge
                  variant="outline"
                  className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-[10px]"
                >
                  {source.usageCount} use{source.usageCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            ))}
            {metadata.primarySources.length > 3 && (
              <div className="text-xs text-slate-500 text-center pt-1">
                +{metadata.primarySources.length - 3} more source
                {metadata.primarySources.length - 3 !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
