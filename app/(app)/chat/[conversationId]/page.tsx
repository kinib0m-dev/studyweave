import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChatLayout } from "@/components/app/chat/ChatLayout";
import { ChatInterface } from "@/components/app/chat/ChatInterface";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <ChatLayout currentConversationId={conversationId}>
      <ChatInterface conversationId={conversationId} />
    </ChatLayout>
  );
}
