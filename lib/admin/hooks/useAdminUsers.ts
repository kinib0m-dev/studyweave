import { trpc } from "@/trpc/client";
import { useState } from "react";
import type { GetUsersInput } from "../validation/schemas";

export function useAdminUsers() {
  const [filters, setFilters] = useState<GetUsersInput>({
    page: 1,
    limit: 50,
  });

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = trpc.admin.getUsers.useQuery(filters);

  const updateUserStatus = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const suspendUser = trpc.admin.suspendUser.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateFilters = (newFilters: Partial<GetUsersInput>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    users: usersData?.users || [],
    totalCount: usersData?.totalCount || 0,
    totalPages: usersData?.totalPages || 0,
    currentPage: usersData?.currentPage || 1,
    hasMore: usersData?.hasMore || false,
    isLoading,
    error,
    filters,
    updateFilters,
    refetch,
    updateUserStatus,
    suspendUser,
  };
}
