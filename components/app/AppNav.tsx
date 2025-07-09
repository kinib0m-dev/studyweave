"use client";

import Link from "next/link";
import Image from "next/image";
import { UserMenu } from "@/components/app/UserMenu";
import { SubjectSwitcher } from "./subjects/SubjectSwitcher";
import { useSubject } from "@/lib/subject/context/subject-context";
import { Building2 } from "lucide-react";

type AppTopNavProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AppNav({ name, email, image }: AppTopNavProps) {
  const { subjects, isLoading } = useSubject();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/70 backdrop-blur-xl border-slate-600/40 shadow-2xl">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/home" className="flex items-center">
              <Image
                src="/icons/logo.png"
                alt="StudyWeave logo"
                width={200}
                height={80}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Subject Switcher */}
          <div className="flex-1 flex justify-center max-w-md mx-8">
            {isLoading ? (
              <div className="flex items-center gap-2 p-2">
                <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              </div>
            ) : subjects.length > 0 ? (
              <div className="w-full max-w-xs">
                <SubjectSwitcher />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-medium">No subject selected</span>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <UserMenu name={name} email={email} image={image} />
          </div>
        </div>
      </div>
    </header>
  );
}
