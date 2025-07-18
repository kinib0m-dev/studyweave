"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
  Search,
} from "lucide-react";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from "@/lib/chat/hooks/use-chat";
import { useCurrentSubject } from "@/lib/subject/hooks/use-current-subject";
import {
  getChatPreferences,
  toggleAntiHallucination,
} from "@/lib/chat/utils/preferences";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface ChatLayoutProps {
  children: React.ReactNode;
  currentConversationId?: string;
}

export function ChatLayout({
  children,
  currentConversationId,
}: ChatLayoutProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [preferences, setPreferences] = useState(getChatPreferences());
  const { subjectId } = useCurrentSubject();

  const { data: conversationsData, isLoading } = useConversations({
    subjectId: subjectId || undefined,
    limit: 50,
    offset: 0,
  });

  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  const conversations = conversationsData?.conversations || [];

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateConversation = async () => {
    try {
      await createConversation.mutateAsync({
        title: "New Conversation",
        subjectId: subjectId || undefined,
      });
    } catch {
      // Error handled by the hook
    }
  };

  const handleToggleAntiHallucination = () => {
    const newValue = toggleAntiHallucination();
    setPreferences((prev) => ({ ...prev, antiHallucinationEnabled: newValue }));
    toast.success(
      newValue ? "Anti-hallucination enabled" : "Anti-hallucination disabled"
    );
    router.refresh();
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation.mutateAsync({ id: conversationId });
    } catch {
      // Error handled by the hook
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] rounded-md">
      {/* Chat Sidebar with Glassmorphism */}
      <div className="w-80 bg-white/10 backdrop-blur-xl border-white/20 shadow-md  flex flex-col rounded-md">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              <h2 className="font-semibold text-slate-200">Chat</h2>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="anti-hallucination"
                      className="text-sm font-medium"
                    >
                      Anti-hallucination
                    </Label>
                    <div className="flex items-center gap-2">
                      {preferences.antiHallucinationEnabled ? (
                        <Eye className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-slate-400" />
                      )}
                      <Switch
                        id="anti-hallucination"
                        checked={preferences.antiHallucinationEnabled}
                        onCheckedChange={handleToggleAntiHallucination}
                      />
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Chat Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            onClick={handleCreateConversation}
            disabled={createConversation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-slate-200 placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-blue-400/20"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-white/10 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={currentConversationId === conversation.id}
                    onDelete={() => handleDeleteConversation(conversation.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area with Gap */}
      <div className="flex-1 flex flex-col gap-2 ml-2">{children}</div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
  };
  isActive: boolean;
  onDelete: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 p-3 rounded-lg transition-all duration-200 hover:bg-white/15",
        isActive
          ? "bg-blue-500/20 border border-blue-400/30"
          : "hover:bg-white/10"
      )}
    >
      <a href={`/chat/${conversation.id}`} className="flex-1 min-w-0 block">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate text-slate-200">
              {conversation.title}
            </h3>
            {conversation.description && (
              <p className="text-xs text-slate-400 truncate mt-1">
                {conversation.description}
              </p>
            )}
          </div>
        </div>
      </a>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{conversation.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
