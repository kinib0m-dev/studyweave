"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, User, Bot, Check, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    sourceAttribution: {
      segments: Array<{
        content: string;
        sources: Array<{
          documentId: string;
          documentTitle: string;
          confidence: number;
        }>;
        overallConfidence: number;
      }>;
    } | null;
    sources: string[] | null;
    tokenCount: number | null;
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

  // Function to highlight high-confidence text with tooltips
  const renderContentWithHighlights = (content: string) => {
    if (!showSources || !message.sourceAttribution || isUser) {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    let highlightedContent = content;
    const segments = message.sourceAttribution.segments || [];

    // Sort segments by content length (longest first) to avoid overlapping highlights
    const sortedSegments = [...segments].sort(
      (a, b) => b.content.length - a.content.length
    );

    sortedSegments.forEach((segment, index) => {
      if (segment.overallConfidence >= 80) {
        const segmentText = segment.content.trim();
        if (segmentText && highlightedContent.includes(segmentText)) {
          const sourcesText = segment.sources
            .map((source) => `${source.documentTitle} (${source.confidence}%)`)
            .join(", ");

          const highlightId = `highlight-${message.id}-${index}`;
          // Changed to darker, more readable highlight color
          const replacement = `<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 px-1 rounded border-b border-blue-300 dark:border-blue-700 cursor-help" data-tooltip-id="${highlightId}" data-sources="${encodeURIComponent(sourcesText)}" data-confidence="${segment.overallConfidence}">${segmentText}</span>`;

          highlightedContent = highlightedContent.replace(
            segmentText,
            replacement
          );
        }
      }
    });

    // Render highlighted content with tooltips
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
        {/* Add tooltip components for highlighted spans */}
        {sortedSegments.map((segment, index) => {
          if (segment.overallConfidence >= 80) {
            const sourcesText = segment.sources
              .map(
                (source) => `${source.documentTitle} (${source.confidence}%)`
              )
              .join(", ");
            const highlightId = `highlight-${message.id}-${index}`;

            return (
              <Tooltip key={highlightId}>
                <TooltipTrigger asChild>
                  <span id={highlightId} />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="font-medium">
                      Sources ({segment.overallConfidence}% confidence):
                    </div>
                    <div className="text-sm">{sourcesText}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // Calculate overall message confidence
  const getOverallConfidence = () => {
    if (!message.sourceAttribution?.segments) return null;

    const segments = message.sourceAttribution.segments;
    const totalConfidence = segments.reduce(
      (sum, segment) => sum + segment.overallConfidence,
      0
    );
    return Math.round(totalConfidence / segments.length);
  };

  // Get unique sources
  const getUniqueSources = () => {
    if (!message.sourceAttribution?.segments) return [];

    const allSources = message.sourceAttribution.segments.flatMap(
      (segment) => segment.sources
    );
    const uniqueSources = allSources.filter(
      (source, index, self) =>
        index === self.findIndex((s) => s.documentId === source.documentId)
    );

    return uniqueSources;
  };

  return (
    <div className={cn("flex gap-4", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn("flex-1 space-y-2", isUser && "flex flex-col items-end")}
      >
        {/* Message Bubble */}
        <div
          className={cn(
            "max-w-3xl rounded-lg p-4 shadow-sm",
            isUser
              ? "bg-background border text-foreground"
              : "bg-card/60 backdrop-blur-sm border text-card-foreground",
            isAssistant && "sidebar-glass" // Apply glassmorphism to assistant messages
          )}
        >
          {/* User messages: simple text */}
          {isUser && (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Assistant messages: formatted with highlights */}
          {isAssistant && (
            <div className="space-y-3">
              {renderContentWithHighlights(message.content)}

              {/* Source Attribution Footer (only when toggle is on) */}
              {showSources && message.sourceAttribution && (
                <div className="mt-4 pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-emerald-600" />
                      <span className="text-xs font-medium">Confidence:</span>
                      <Badge variant="secondary" className="text-xs">
                        {getOverallConfidence()}%
                      </Badge>
                    </div>
                  </div>

                  {getUniqueSources().length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Sources:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {getUniqueSources().map((source, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {source.documentTitle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Actions & Metadata */}
        <div
          className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            isUser && "flex-row-reverse"
          )}
        >
          <span>
            {formatDistanceToNow(message.createdAt, { addSuffix: true })}
          </span>

          {isAssistant && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
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
          )}
        </div>
      </div>
    </div>
  );
}
