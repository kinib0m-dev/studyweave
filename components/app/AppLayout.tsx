"use client";

import { AppNav } from "./AppNav";

interface AppLayoutProps {
  children: React.ReactNode;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function AppLayout({
  children,
  name,
  email,
  image,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppNav name={name} email={email} image={image} />
      <main className="pt-16">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
