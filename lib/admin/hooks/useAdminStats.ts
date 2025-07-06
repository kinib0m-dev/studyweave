import { trpc } from "@/trpc/client";

export function useAdminStats() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = trpc.admin.getSystemStats.useQuery();

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}
