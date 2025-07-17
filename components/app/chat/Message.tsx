"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  User,
  Bot,
  FileText,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  MessageRole,
  StructuredResponse,
} from "@/lib/chat/validation/chat-schema";
import {
  formatStructuredResponseForUI,
  getFileUsageBadgeClass,
  shouldShowFileUsageWarning,
  generateSourceTooltipContent,
  FormattedSegment,
} from "@/lib/chat/utils/response-formatter";
import { getChatPreferences } from "@/lib/chat/utils/preferences";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MessageProps {
  id: string;
  role: MessageRole;
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
  const preferences = getChatPreferences();

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

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  if (role === "user") {
    return (
      <div className="flex justify-end mb-6">
        <div className="flex items-start gap-3 max-w-[80%]">
          <div className="flex-1">
            <div className="bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-3">
              <p className="text-sm leading-relaxed">{content}</p>
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <span className="text-xs text-slate-500">
                {formatTime(createdAt)}
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
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-1">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start gap-3 max-w-[90%]">
        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center shrink-0 mt-1">
          <Bot className="h-4 w-4 text-slate-300" />
        </div>
        <div className="flex-1">
          <AssistantMessageContent
            content={content}
            isStructured={isStructured}
            preferences={preferences}
            sources={sources}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              {formatTime(createdAt)}
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
  preferences: any;
  sources?: string[];
}

function AssistantMessageContent({
  content,
  isStructured,
  preferences,
}: AssistantMessageContentProps) {
  if (!isStructured || !preferences.antiHallucinationEnabled) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
        <p className="text-sm leading-relaxed text-slate-200">{content}</p>
      </div>
    );
  }

  let structuredResponse: StructuredResponse;
  try {
    structuredResponse = JSON.parse(content);
  } catch {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
        <p className="text-sm leading-relaxed text-slate-200">{content}</p>
      </div>
    );
  }

  const formattedSegments = formatStructuredResponseForUI(
    structuredResponse,
    preferences.antiHallucinationEnabled
  );

  const { metadata } = structuredResponse;
  const showWarning = shouldShowFileUsageWarning(
    metadata.fileUsagePercentage,
    preferences.minimumFileUsageWarning
  );

  return (
    <div className="space-y-3">
      {/* Anti-hallucination header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge
            className={getFileUsageBadgeClass(metadata.fileUsagePercentage)}
          >
            <Eye className="h-3 w-3 mr-1" />
            {metadata.fileUsagePercentage}% from files
          </Badge>

          {showWarning && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Low file usage - response may contain general knowledge</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {metadata.primarySources.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <FileText className="h-3 w-3" />
                    <span>{metadata.primarySources.length} sources</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {metadata.primarySources
                      .slice(0, 3)
                      .map((source, index) => (
                        <p key={index} className="text-xs">
                          {source.documentTitle} ({source.usageCount}x)
                        </p>
                      ))}
                    {metadata.primarySources.length > 3 && (
                      <p className="text-xs text-slate-400">
                        +{metadata.primarySources.length - 3} more
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Message content with highlighting */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
        <div className="text-sm leading-relaxed">
          <TooltipProvider>
            {formattedSegments.map((segment) => (
              <HighlightedSegment key={segment.id} segment={segment} />
            ))}
          </TooltipProvider>
        </div>
      </div>

      {/* Sources footer */}
      {preferences.showSourceTooltips && metadata.primarySources.length > 0 && (
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Sources used:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {metadata.primarySources.slice(0, 3).map((source, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-slate-700/30 text-slate-400 border-slate-600/50"
              >
                {source.documentTitle}
              </Badge>
            ))}
            {metadata.primarySources.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs bg-slate-700/30 text-slate-400 border-slate-600/50"
              >
                +{metadata.primarySources.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface HighlightedSegmentProps {
  segment: FormattedSegment;
}

function HighlightedSegment({ segment }: HighlightedSegmentProps) {
  const tooltipContent = generateSourceTooltipContent(segment);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline rounded px-1 py-0.5 border transition-all cursor-help",
            segment.cssClass,
            segment.type === "from_file"
              ? "hover:bg-emerald-900/30"
              : "hover:bg-slate-700/30"
          )}
        >
          {segment.text}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs whitespace-pre-line">{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}
