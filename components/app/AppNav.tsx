"use client";

import Link from "next/link";
import Image from "next/image";
import { UserMenu } from "@/components/app/UserMenu";
import { SubjectSwitcher } from "./subjects/SubjectSwitcher";
import { useSubject } from "@/lib/subject/context/subject-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Building2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

type AppTopNavProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AppNav({ name, email, image }: AppTopNavProps) {
  const { subjects, isLoading } = useSubject();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mobile Navigation Content
  const MobileNavContent = () => (
    <div className="flex flex-col space-y-6 py-2 px-4">
      {/* Subject Switcher in mobile menu */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Current Subject</h3>
        {isLoading ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-700/50">
            <div className="h-6 w-6 rounded bg-slate-600 animate-pulse" />
            <div className="h-4 w-24 rounded bg-slate-600 animate-pulse" />
          </div>
        ) : subjects.length > 0 ? (
          <SubjectSwitcher />
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-700/50 text-slate-400">
            <Building2 className="h-5 w-5" />
            <span className="text-sm">No subject selected</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
            asChild
          >
            <Link href="/docs" onClick={() => setMobileMenuOpen(false)}>
              Upload Docs
            </Link>
          </Button>
          <Button
            variant="outline"
            className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
            asChild
          >
            <Link href="/flashcards" onClick={() => setMobileMenuOpen(false)}>
              Flashcards
            </Link>
          </Button>
        </div>
      </div>

      {/* User Info in mobile menu */}
      <div className="pt-4 border-t border-slate-600/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-300">
              {name?.charAt(0) || email?.charAt(0) || "U"}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{name}</p>
            <p className="text-xs text-slate-400">{email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
            asChild
          >
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
              Settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/90 backdrop-blur-xl border-b border-slate-600/40 shadow-2xl">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link href="/home" className="flex items-center">
            <Image
              src="/icons/logo.png"
              alt="StudyWeave logo"
              width={120}
              height={48}
              className="h-6 w-auto"
            />
          </Link>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 bg-slate-900/95 backdrop-blur-xl border-slate-600/40 p-0"
            >
              <MobileNavContent />
            </SheetContent>
          </Sheet>
        </div>
      </header>
    );
  }

  // Desktop Navigation
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/70 backdrop-blur-xl border-b border-slate-600/40 shadow-2xl">
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
          <div className="hidden lg:flex flex-1 justify-center max-w-md mx-8">
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
