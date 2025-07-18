import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChatInterface } from "@/components/app/chat/ChatInterface";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat Conversation",
  description: "Study assistant conversation",
};

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="h-full">
      <ChatInterface initialConversationId={id} />
    </div>
  );
}
