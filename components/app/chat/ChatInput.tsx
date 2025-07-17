"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Send, Loader2, FileText, AlertCircle, Zap } from "lucide-react";
import { useSendMessage, useStreamingMessage } from "@/lib/chat/hooks/use-chat";
import { useCurrentSubject } from "@/lib/subject/hooks/use-current-subject";
import { useDocuments } from "@/lib/docs/hooks/use-docs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/auth/hooks/use-auth";

interface ChatInputProps {
  conversationId: string;
  onMessageSent?: () => void;
}

export function ChatInput({ conversationId, onMessageSent }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [useStreaming, setUseStreaming] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const user = useCurrentUser();
  const { subjectId } = useCurrentSubject();
  const sendMessage = useSendMessage();
  const { sendStreamingMessage, isStreaming, streamingContent } =
    useStreamingMessage();
  const { documents } = useDocuments({
    subjectId: subjectId || undefined,
  });

  const hasDocuments = documents.length > 0;
  const isLoading = sendMessage.isPending || isStreaming;

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200;
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isLoading) return;

    if (!hasDocuments) {
      toast.error(
        "Please upload some documents first to have a meaningful conversation."
      );
      return;
    }

    const messageToSend = message.trim();
    setMessage("");

    try {
      if (useStreaming) {
        await sendStreamingMessage(
          conversationId,
          messageToSend,
          subjectId || undefined,
          user?.id
        );
      } else {
        await sendMessage.mutateAsync({
          conversationId,
          content: messageToSend,
          subjectId: subjectId || undefined,
        });
      }
      onMessageSent?.();
    } catch {
      setMessage(messageToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const isDisabled = isLoading || !hasDocuments;

  return (
    <div className="border-t border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
      {/* Document status and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">
              {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
              available
            </span>
          </div>

          {!hasDocuments && (
            <Badge
              variant="outline"
              className="bg-red-900/30 text-red-300 border-red-700/50"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              No documents
            </Badge>
          )}
        </div>

        {/* Streaming toggle */}
        <div className="flex items-center gap-2">
          <Label htmlFor="streaming-mode" className="text-sm text-slate-400">
            Streaming
          </Label>
          <Switch
            id="streaming-mode"
            checked={useStreaming}
            onCheckedChange={setUseStreaming}
            disabled={isDisabled}
          />
          <Zap className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Streaming content display */}
      {isStreaming && streamingContent && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">AI is responding...</span>
          </div>
          <div className="text-sm text-slate-300">{streamingContent}</div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              hasDocuments
                ? "Ask a question about your study materials..."
                : "Upload documents first to start chatting..."
            }
            className="min-h-[44px] max-h-[200px] resize-none pr-12 bg-slate-900/50 border-slate-700/50 text-slate-200 placeholder-slate-500"
            disabled={isDisabled}
          />

          {/* Character count */}
          {message.length > 0 && (
            <div className="absolute bottom-2 right-2 text-xs text-slate-500">
              {message.length}/10000
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isDisabled || !message.trim()}
          size="lg"
          className={cn(
            "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Helper text */}
      <div className="text-xs text-slate-500">
        Press{" "}
        <kbd className="px-1 py-0.5 bg-slate-700 rounded">Shift + Enter</kbd>{" "}
        for new line
        {useStreaming && " • Streaming mode enabled for faster responses"}
      </div>
    </div>
  );
}
