import { AdminLayout } from "@/components/admin/AdminLayout";
import { HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin Dashboard - Manage users and system settings",
};

export default function AdminPage() {
  return (
    <HydrateClient>
      <AdminLayout />
    </HydrateClient>
  );
}
