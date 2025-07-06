"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCurrentSubject } from "./use-current-subject";

/**
 * Hook to create a new subject
 */
export function useCreateSubject() {
  const utils = trpc.useUtils();
  const router = useRouter();
  const { subject } = useCurrentSubject();

  return trpc.subject.create.useMutation({
    onSuccess: (data) => {
      toast.success("Subject created successfully!");

      // Invalidate subjects list
      utils.subject.getAll.invalidate();

      // Auto-switch to the new subject if no current subject
      if (!subject && data.subject) {
        // The context will automatically handle switching to the new subject
        // since it will be included in the refreshed list
      }

      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create subject");
    },
  });
}

/**
 * Hook to update an subject (requires subject context)
 */
export function useUpdateSubject() {
  const utils = trpc.useUtils();
  const { subjectId } = useCurrentSubject();

  return trpc.subject.update.useMutation({
    onSuccess: () => {
      toast.success("Subject updated successfully!");

      // Invalidate related queries
      utils.subject.getAll.invalidate();

      if (subjectId) {
        utils.subject.getById.invalidate({ subjectId });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update subject");
    },
  });
}

/**
 * Hook to delete an subject (requires subject context)
 */
export function useDeleteSubject() {
  const utils = trpc.useUtils();
  const router = useRouter();

  return trpc.subject.delete.useMutation({
    onSuccess: () => {
      toast.success("Subject deleted successfully!");

      // Invalidate subjects list
      utils.subject.getAll.invalidate();

      // Redirect to subjects list or dashboard
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete subject");
    },
  });
}

/**
 * Hook to get all subjects for the current user
 */
export function useSubjects() {
  return trpc.subject.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to get a single subject by ID (uses subject context)
 */
export function useSubject(subjectId?: string) {
  const { subjectId: currentSubjectId } = useCurrentSubject();
  const targetSubjectId = subjectId || currentSubjectId;

  return trpc.subject.getById.useQuery(
    { subjectId: targetSubjectId! },
    {
      enabled: !!targetSubjectId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 2,
    }
  );
}
