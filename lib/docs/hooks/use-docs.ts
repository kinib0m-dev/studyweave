"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
} from "../validation/docs-schema";

/**
 * Hook for document creation
 */
export function useCreateDocument() {
  const router = useRouter();

  const mutation = trpc.docs.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to refetch document list
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error creating document: ${error.message}`);
    },
  });

  const createDocument = async (document: CreateDocumentSchema) => {
    try {
      return await mutation.mutateAsync(document);
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  };

  return {
    createDocument,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for fetching a single document by ID
 */
export function useDocument(id: string) {
  const enabled = !!id;

  const { data, isLoading, isError, error, refetch } =
    trpc.docs.getById.useQuery(
      { id },
      {
        enabled,
        staleTime: 30 * 1000, // 30 seconds
      }
    );

  return {
    document: data?.document,
    isLoading,
    isError,
    error,
    refetch,
  };
}

/**
 * Hook for updating a document
 */
export function useUpdateDocument() {
  const utils = trpc.useUtils();
  const router = useRouter();

  const mutation = trpc.docs.update.useMutation({
    onSuccess: (data) => {
      // Invalidate queries to refetch documents
      utils.docs.getById.invalidate({ id: data.document.id });
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error updating document: ${error.message}`);
    },
  });

  const updateDocument = async (document: UpdateDocumentSchema) => {
    try {
      return await mutation.mutateAsync(document);
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  };

  return {
    updateDocument,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

/**
 * Hook for deleting a document
 */
export function useDeleteDocument() {
  const router = useRouter();

  const mutation = trpc.docs.delete.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(`Error deleting document: ${error.message}`);
    },
  });

  const deleteDocument = async (id: string) => {
    try {
      return await mutation.mutateAsync({ id });
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  };

  return {
    deleteDocument,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
