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
          <div className="text-right">
            <div className="text-sm leading-relaxed text-slate-200 inline-block text-right">
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
        <div className="bg-white/10 backdrop-blur-xl border-white/20 shadow-md rounded-2xl rounded-tl-md p-4">
          <AssistantMessageContent
            content={content}
            isStructured={isStructured}
            preferences={preferences}
            sources={sources}
          />
        </div>

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
      <p className="mb-3 last:mb-0 leading-relaxed text-slate-200">
        {children}
      </p>
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

  // Always try to parse structured content first, regardless of anti-hallucination setting
  if (isStructured) {
    try {
      const structuredResponse: StructuredResponse = JSON.parse(content);

      // If anti-hallucination is disabled, show simple unified format
      if (!preferences.antiHallucinationEnabled) {
        const displayContent = structuredResponse.response
          .map((segment) => segment.text)
          .join(" ");

        return (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown components={markdownComponents}>
              {displayContent}
            </ReactMarkdown>
          </div>
        );
      }

      // If anti-hallucination is enabled, show enhanced format with source attribution
      const formattedSegments = formatStructuredResponseForUI(
        structuredResponse,
        preferences.antiHallucinationEnabled
      );

      return (
        <TooltipProvider>
          <div className="space-y-4">
            {formattedSegments.map((segment, index) => (
              <div key={index} className="space-y-2">
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown components={markdownComponents}>
                    {segment.text}
                  </ReactMarkdown>
                </div>

                {/* Enhanced source and confidence display */}
                {segment.type === "from_file" &&
                  segment.sourceDocumentTitle && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs cursor-help transition-colors",
                              getFileUsageBadgeClass(80) // Default to high confidence styling
                            )}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {segment.sourceDocumentTitle}
                            {preferences.showFileUsagePercentage && (
                              <span className="ml-1">
                                ({Math.round((segment.confidence || 0) * 100)}%)
                              </span>
                            )}
                          </Badge>
                        </TooltipTrigger>
                        {preferences.showSourceTooltips && (
                          <TooltipContent>
                            <div>{generateSourceTooltipContent(segment)}</div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  )}

                {/* Confidence indicator for anti-hallucination */}
                {segment.confidence && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          segment.confidence >= 0.8
                            ? "bg-emerald-400"
                            : segment.confidence >= 0.6
                              ? "bg-yellow-400"
                              : "bg-red-400"
                        )}
                      />
                      <span>
                        Confidence: {Math.round(segment.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Overall metadata */}
            {structuredResponse.metadata && (
              <div className="border-t border-slate-600/30 pt-3 mt-4">
                <div className="text-xs text-slate-400 space-y-1">
                  <div>
                    Sources used:{" "}
                    {structuredResponse.metadata.fileBasedSegments}/
                    {structuredResponse.metadata.totalSegments} segments
                  </div>
                  <div>
                    File usage:{" "}
                    {structuredResponse.metadata.fileUsagePercentage}%
                  </div>
                  <div>
                    Average confidence:{" "}
                    {Math.round(
                      (structuredResponse.metadata.averageConfidence || 0) * 100
                    )}
                    %
                  </div>
                </div>
              </div>
            )}
          </div>
        </TooltipProvider>
      );
    } catch (error) {
      console.error("Failed to parse structured response:", error);
      // Fallback to treating as plain text
    }
  }

  // Fallback to simple format for non-structured content or parsing errors
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
