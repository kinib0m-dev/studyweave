"use client";

import { useState } from "react";
import {
  useConversations,
  useDeleteConversation,
} from "@/lib/chat/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConversationListProps {
  subjectId: string;
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  subjectId,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
}: ConversationListProps) {
  const { data: conversationsData, isLoading } = useConversations(subjectId);
  const deleteConversation = useDeleteConversation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const conversations = conversationsData?.conversations || [];

  const handleDeleteClick = (
    id: string,
    title: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setConversationToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    try {
      await deleteConversation.mutateAsync({
        conversationId: conversationToDelete.id,
      });
      toast.success("Conversation deleted successfully");
      setDeleteDialogOpen(false);
      setConversationToDelete(null);

      // If we're deleting the currently selected conversation, clear selection
      if (selectedConversationId === conversationToDelete.id) {
        onNewConversation();
      }
    } catch (error) {
      toast.error("Failed to delete conversation");
      console.error("Delete error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* Fixed Header */}
        <div className="shrink-0 p-4 border-b">
          <Button className="w-full gap-2" variant="outline" disabled>
            <Plus className="h-4 w-4" />
            New Conversation
          </Button>
        </div>

        {/* Loading State */}
        <div className="flex-1 p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-muted/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="shrink-0 p-4 border-b backdrop-blur">
        <Button
          onClick={onNewConversation}
          className="w-full gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      {/* Scrollable Conversations List */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group relative p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                      selectedConversationId === conversation.id &&
                        "bg-muted/70 border border-border"
                    )}
                    onClick={() => onConversationSelect(conversation.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate mb-1">
                          {conversation.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(conversation.updatedAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      <Button
                        size={"sm"}
                        variant={"ghost"}
                        className="text-destructive"
                        onClick={(e) =>
                          handleDeleteClick(
                            conversation.id,
                            conversation.title,
                            e
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {conversationToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
