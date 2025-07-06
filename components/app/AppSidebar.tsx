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
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AppSidebar({ name, email, image }: UserMenuProps) {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          {open ? (
            <Link href="/settings" className="text-xl font-bold">
              AUTH
            </Link>
          ) : (
            <Link href="/settings" className="text-xs font-bold">
              AUTH
            </Link>
          )}
        </div>
      </SidebarHeader>
      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu></SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
