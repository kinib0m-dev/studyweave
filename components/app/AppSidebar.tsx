"use client";

import Link from "next/link";
import { UserMenu } from "@/components/app/UserMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  StickyNote,
  Map,
  BookOpenCheck,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubject } from "@/lib/subject/context/subject-context";
import { getSubjectColor } from "@/lib/subject/utils/subject-utils";
import { SubjectSwitcher } from "./subjects/SubjectSwitcher";
import { EmptySubjectState } from "./subjects/EmptySubjectState";

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AppSidebar({ name, email, image }: UserMenuProps) {
  const { open } = useSidebar();
  const pathname = usePathname();
  const { currentSubject, subjects, isLoading } = useSubject();

  // Get subject color for branding
  const orgColor = currentSubject
    ? getSubjectColor(currentSubject.color)
    : null;

  const isActiveRoute = (route: string) => {
    if (route === "/dashboard") {
      return pathname === route;
    }
    return pathname.startsWith(route);
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          {open ? (
            <Link href="/dashboard">
              <Image
                src={"/icons/logo.png"}
                alt="StudyWeave logo"
                width={200}
                height={80}
              />
            </Link>
          ) : (
            <Link href="/dashboard">
              <Image
                src={"/icon.png"}
                alt="StudyWeave logo"
                width={200}
                height={80}
              />
            </Link>
          )}
        </div>
        {/* Subject Switcher or Empty State */}
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center gap-2 p-2">
              <div className="h-6 w-6 rounded bg-muted animate-pulse" />
              {open && (
                <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              )}
            </div>
          ) : subjects.length > 0 ? (
            <SubjectSwitcher />
          ) : (
            open && <EmptySubjectState variant="sidebar" />
          )}
        </div>
      </SidebarHeader>
      <Separator />

      <SidebarContent>
        {/* Only show navigation if user has subjects */}
        {subjects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Dashboard */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Dashboard"
                    className={cn(
                      isActiveRoute("/dashboard") &&
                        orgColor &&
                        `bg-primary px-2 py-1 rounded-lg hover:bg-primary`
                    )}
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Flashcards */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Flashcards"
                    className={cn(
                      isActiveRoute("/flashcards") &&
                        orgColor &&
                        `bg-primary text-background px-2 py-1 rounded-lg hover:bg-primary hover:text-background`
                    )}
                  >
                    <Link href="/flashcards">
                      <StickyNote />
                      <span>Flashcards</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Maps */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Maps"
                    className={cn(
                      isActiveRoute("/maps") &&
                        orgColor &&
                        `bg-primary text-background px-2 py-1 rounded-lg hover:bg-primary hover:text-background`
                    )}
                  >
                    <Link href="/maps">
                      <Map />
                      <span>Maps</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Quizzes */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Quizzes"
                    className={cn(
                      isActiveRoute("/quizzes") &&
                        orgColor &&
                        `bg-primary text-background px-2 py-1 rounded-lg hover:bg-primary hover:text-background`
                    )}
                  >
                    <Link href="/quizes">
                      <BookOpenCheck />
                      <span>Quizzes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Tutor */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Tutor"
                    className={cn(
                      isActiveRoute("/tutor") &&
                        orgColor &&
                        `bg-primary text-background px-2 py-1 rounded-lg hover:bg-primary hover:text-background`
                    )}
                  >
                    <Link href="/tutor">
                      <Bot />
                      <span>Tutor</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Show minimal empty state when sidebar is collapsed and no subjects */}
        {subjects.length === 0 && !open && (
          <div className="px-2 py-4">
            <EmptySubjectState variant="minimal" />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="px-2">Account</SidebarGroupLabel>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <UserMenu name={name} email={email} image={image} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
