"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, FileText, AlertCircle } from "lucide-react";
import { useSendMessage } from "@/lib/chat/hooks/use-chat";
import { useCurrentSubject } from "@/lib/subject/hooks/use-current-subject";
import { useDocuments } from "@/lib/docs/hooks/use-docs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatInputProps {
  conversationId: string;
  onMessageSent?: () => void;
}

export function ChatInput({ conversationId, onMessageSent }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { subjectId } = useCurrentSubject();
  const sendMessage = useSendMessage();
  const { documents } = useDocuments({
    subjectId: subjectId || undefined,
  });

  const hasDocuments = documents.length > 0;

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200; // Max height in pixels
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || sendMessage.isPending) return;

    if (!hasDocuments) {
      toast.error(
        "Please upload some documents first to have a meaningful conversation."
      );
      return;
    }

    const messageToSend = message.trim();
    setMessage("");

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: messageToSend,
        subjectId: subjectId || undefined,
      });
      onMessageSent?.();
    } catch {
      // Error handling is done in the hook
      setMessage(messageToSend); // Restore message on error
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

  const isDisabled = sendMessage.isPending || !hasDocuments;

  return (
    <div className="border-t border-slate-700/50 bg-slate-800/30 p-4">
      {/* Document status */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">
            {documents.length} document{documents.length !== 1 ? "s" : ""}{" "}
            available
          </span>
          {hasDocuments && (
            <Badge
              variant="outline"
              className="bg-emerald-900/30 text-emerald-300 border-emerald-700/50"
            >
              Ready
            </Badge>
          )}
        </div>

        {!hasDocuments && (
          <div className="flex items-center gap-2 text-sm text-orange-400">
            <AlertCircle className="h-4 w-4" />
            <span>Upload documents to start chatting</span>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
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
            disabled={isDisabled}
            className={cn(
              "min-h-[44px] max-h-[200px] resize-none bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500",
              !hasDocuments && "opacity-50"
            )}
            rows={1}
          />

          {/* Character counter for long messages */}
          {message.length > 500 && (
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
            "px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white transition-all",
            sendMessage.isPending && "cursor-not-allowed",
            !hasDocuments && "opacity-50 cursor-not-allowed"
          )}
        >
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Help text */}
      <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
        <span>Press Shift+Enter for new line</span>
        {hasDocuments && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            Anti-hallucination active
          </span>
        )}
      </div>
    </div>
  );
}
