"use client";

import { ChatLayout } from "@/components/app/chat/ChatLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, FileText, Brain, Zap } from "lucide-react";
import { useCreateConversation } from "@/lib/chat/hooks/use-chat";
import { useCurrentSubject } from "@/lib/subject/hooks/use-current-subject";

export default function ChatIndexPage() {
  const { subjectId } = useCurrentSubject();

  const createConversation = useCreateConversation();

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

  return (
    <ChatLayout>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-8 max-w-3xl mx-auto px-6">
          {/* Hero section */}
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-slate-200 mb-4">
                AI Study Assistant
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed">
                Transform your study materials into interactive conversations.
                Get instant answers with source attribution and
                anti-hallucination technology.
              </p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Document-Powered
              </h3>
              <p className="text-slate-400">
                Upload your notes, slides, and textbooks. The AI uses only your
                materials to provide accurate, relevant answers.
              </p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Anti-Hallucination
              </h3>
              <p className="text-slate-400">
                Every response shows exactly what came from your files vs. AI
                reasoning, with confidence scores and source tracking.
              </p>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Smart Context
              </h3>
              <p className="text-slate-400">
                Advanced RAG technology finds the most relevant information from
                your materials for each question.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button
              onClick={handleCreateConversation}
              disabled={createConversation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start New Conversation
            </Button>

            <p className="text-sm text-slate-500">
              Upload your study materials first to enable AI conversations
            </p>
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-700/50">
            <Badge
              variant="outline"
              className="bg-emerald-900/30 text-emerald-300 border-emerald-700/50"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
              Anti-hallucination Active
            </Badge>
            <Badge
              variant="outline"
              className="bg-blue-900/30 text-blue-300 border-blue-700/50"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              RAG Powered
            </Badge>
            <Badge
              variant="outline"
              className="bg-purple-900/30 text-purple-300 border-purple-700/50"
            >
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
              Source Tracking
            </Badge>
          </div>
        </div>
      </div>
    </ChatLayout>
  );
}
