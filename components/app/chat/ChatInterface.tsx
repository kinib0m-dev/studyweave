"use client";

import { useState, useEffect } from "react";
import { useCurrentSubject } from "@/lib/subject/hooks/use-current-subject";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { AntiHallucinationToggle } from "./AntiHallucinationToggle";
import { useSourceAttribution } from "@/lib/chat/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface ChatInterfaceProps {
  initialConversationId?: string;
}

export function ChatInterface({ initialConversationId }: ChatInterfaceProps) {
  const { subjectId, hasSubject, subjectName } = useCurrentSubject();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(initialConversationId || null);
  const [showNewChat, setShowNewChat] = useState(false);
  const { showSources, toggleSources } = useSourceAttribution();
  const router = useRouter();

  // Update selected conversation when URL changes
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversationId(initialConversationId);
      setShowNewChat(false);
    }
  }, [initialConversationId]);

  if (!hasSubject) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Subject Selected</h3>
          <p className="text-muted-foreground">
            Please select a subject to start chatting with your study assistant.
          </p>
        </Card>
      </div>
    );
  }

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setShowNewChat(true);
    router.push("/chat");
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowNewChat(false);
    router.push(`/chat/${conversationId}`);
  };

  const handleConversationCreated = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowNewChat(false);
    router.push(`/chat/${conversationId}`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Fixed Header - Explicit height */}
      <div className="h-20 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4 h-full">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Study Assistant</h1>
              <p className="text-sm text-muted-foreground">{subjectName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AntiHallucinationToggle
              enabled={showSources}
              onToggle={toggleSources}
            />
            <Button onClick={handleNewConversation} className="gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Takes remaining height */}
      <div className="flex-1 flex min-h-0">
        {/* Conversation Sidebar - Fixed Width */}
        <div className="w-80 shrink-0 border-r bg-muted/20">
          <ConversationList
            subjectId={subjectId!}
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* Chat Area - Takes remaining width */}
        <div className="flex-1 min-w-0">
          <ChatWindow
            conversationId={selectedConversationId}
            showNewChat={showNewChat}
            showSources={showSources}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>
    </div>
  );
}
