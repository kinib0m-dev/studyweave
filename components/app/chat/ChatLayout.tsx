"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MessageSquare,
  Settings,
  Search,
  MoreVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useConversations,
  useCreateConversation,
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

interface ChatLayoutProps {
  children: React.ReactNode;
  currentConversationId?: string;
}

export function ChatLayout({
  children,
  currentConversationId,
}: ChatLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [preferences, setPreferences] = useState(getChatPreferences());
  const { subject, subjectId } = useCurrentSubject();

  const { data: conversationsData, isLoading } = useConversations({
    subjectId: subjectId || undefined,
    limit: 50,
    offset: 0,
  });

  const createConversation = useCreateConversation();

  const conversations = conversationsData?.conversations || [];

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateConversation = async () => {
    try {
      await createConversation.mutateAsync({
        title: "New Conversation",
        subjectId: subjectId || undefined, // Convert null to undefined
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
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-900">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-700/50 bg-slate-800/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50">
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
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Chat Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {subject && (
            <Badge
              variant="outline"
              className="mb-3 bg-blue-900/30 text-blue-300 border-blue-700/50"
            >
              {subject.name}
            </Badge>
          )}

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
        <div className="p-4 border-b border-slate-700/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder:text-slate-400"
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
                    className="h-16 bg-slate-700/30 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">
                  Start a new conversation to begin
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === currentConversationId}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: {
    id: string;
    title: string;
    description: string | null;
    updatedAt: Date;
  };
  isActive: boolean;
}

function ConversationItem({ conversation, isActive }: ConversationItemProps) {
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours =
      Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <a
      href={`/chat/${conversation.id}`}
      className={cn(
        "block p-3 rounded-lg transition-colors border",
        isActive
          ? "bg-blue-900/30 border-blue-700/50 text-blue-200"
          : "bg-slate-700/20 border-slate-600/30 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
          {conversation.description && (
            <p className="text-xs text-slate-400 truncate mt-1">
              {conversation.description}
            </p>
          )}
        </div>
        <span className="text-xs text-slate-500 shrink-0">
          {formatRelativeTime(conversation.updatedAt)}
        </span>
      </div>
    </a>
  );
}
