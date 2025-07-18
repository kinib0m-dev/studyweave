import type { Metadata } from "next";
import { ChatInterface } from "@/components/app/chat/ChatInterface";

export const metadata: Metadata = {
  title: "Chat Assistant",
  description: "Intelligent study assistant with anti-hallucination features",
};

export default function ChatPage() {
  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  );
}
