"use client";

import { useState, useEffect } from "react";
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
} from "@/lib/chat/utils/response-formatter";
import {
  getChatPreferences,
  ChatPreferences,
} from "@/lib/chat/utils/preferences";
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
  isStructured = false,
  sources,
}: MessageProps) {
  const [copied, setCopied] = useState(false);
  const [preferences, setPreferences] =
    useState<ChatPreferences>(getChatPreferences());

  // Listen for preference changes
  useEffect(() => {
    const handleStorageChange = () => {
      setPreferences(getChatPreferences());
    };

    // Listen for storage changes (when preferences are updated)
    window.addEventListener("storage", handleStorageChange);

    // Also listen for a custom event we'll dispatch when preferences change
    window.addEventListener("chatPreferencesChanged", handleStorageChange);

    // Cleanup
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
              <p className="text-sm leading-relaxed">{content}</p>
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
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-1">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
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
          <div className="flex justify-start mt-1">
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
    // For structured content with anti-hallucination disabled, convert to plain text
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
        <p className="text-sm leading-relaxed text-slate-200">
          {displayContent}
        </p>
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
            {formattedSegments.map((segment, index) => {
              const isFileContent = segment.type === "from_file";
              const tooltipContent = generateSourceTooltipContent(segment);

              return (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "transition-all duration-200 cursor-help",
                        isFileContent
                          ? "text-emerald-300 bg-emerald-900/20 px-1 py-0.5 rounded border border-emerald-700/30"
                          : "text-slate-300"
                      )}
                    >
                      {segment.text}
                      {index < formattedSegments.length - 1 && " "}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{tooltipContent}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
