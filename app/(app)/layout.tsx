import { auth } from "@/auth";
import AppLayout from "@/components/app/AppLayout";
import { SubjectProvider } from "@/lib/subject/context/subject-provider";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <SubjectProvider>
      <AppLayout
        name={session.user.name}
        email={session.user.email}
        image={session.user.image}
      >
        {children}
      </AppLayout>
    </SubjectProvider>
  );
}
