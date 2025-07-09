"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ClientFileSchema } from "../validation/file-extraction-schema";
import { useState, useCallback } from "react";

// Helper function to convert File to base64 with progress
const fileToBase64WithProgress = (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadstart = () => {
      onProgress?.(0);
    };

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 50); // 50% for reading
        onProgress?.(progress);
      }
    };

    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove the data URL prefix to get just the base64 data
        const base64 = reader.result.split(",")[1];
        onProgress?.(75); // 75% for conversion
        resolve(base64);
      } else {
        reject(new Error("Failed to read file as base64"));
      }
    };

    reader.onerror = (error) => reject(error);

    reader.readAsDataURL(file);
  });
};

interface FileProgress {
  fileName: string;
  progress: number;
  status: "reading" | "uploading" | "processing" | "completed" | "error";
  message?: string;
}

/**
 * Hook for file extraction and document creation with progress tracking
 */
export function useFileExtractor() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [fileProgress, setFileProgress] = useState<
    Record<string, FileProgress>
  >({});

  const mutation = trpc.fileExtractor.extractAndStore.useMutation({
    onSuccess: (data, variables) => {
      const { wordCount, pageCount } = data.extractedResult;

      // Update progress to completed
      setFileProgress((prev) => ({
        ...prev,
        [variables.fileName]: {
          fileName: variables.fileName,
          progress: 100,
          status: "completed",
          message: `Extracted ${wordCount} words${pageCount ? `, ${pageCount} pages` : ""}`,
        },
      }));

      toast.success(
        `File "${variables.fileName}" extracted successfully! ${wordCount} words${
          pageCount ? `, ${pageCount} pages` : ""
        } processed.`
      );

      // Invalidate and refetch queries to update stats
      utils.docs.getAll.invalidate();
      utils.fileExtractor.getExtractionStats.invalidate();

      // Force refresh the page data
      router.refresh();

      // Clear progress after a delay
      setTimeout(() => {
        setFileProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[variables.fileName];
          return newProgress;
        });
      }, 3000);
    },
    onError: (error, variables) => {
      // Update progress to error
      setFileProgress((prev) => ({
        ...prev,
        [variables.fileName]: {
          fileName: variables.fileName,
          progress: 0,
          status: "error",
          message: error.message,
        },
      }));

      toast.error(
        `Error extracting file "${variables.fileName}": ${error.message}`
      );

      // Clear error after a delay
      setTimeout(() => {
        setFileProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[variables.fileName];
          return newProgress;
        });
      }, 5000);
    },
  });

  const extractFile = async (data: ClientFileSchema) => {
    const { file, title, subjectId } = data;

    try {
      // Initialize progress
      setFileProgress((prev) => ({
        ...prev,
        [file.name]: {
          fileName: file.name,
          progress: 0,
          status: "reading",
          message: "Reading file...",
        },
      }));

      // Convert file to base64 with progress
      const fileData = await fileToBase64WithProgress(file, (progress) => {
        setFileProgress((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress,
            status: progress < 50 ? "reading" : "uploading",
            message: progress < 50 ? "Reading file..." : "Uploading file...",
          },
        }));
      });

      // Update progress to processing
      setFileProgress((prev) => ({
        ...prev,
        [file.name]: {
          ...prev[file.name],
          progress: 80,
          status: "processing",
          message: "Processing and extracting text...",
        },
      }));

      // Call the tRPC procedure with the converted data
      return await mutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData,
        title,
        subjectId,
      });
    } catch (error) {
      // Update progress to error
      setFileProgress((prev) => ({
        ...prev,
        [file.name]: {
          fileName: file.name,
          progress: 0,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }));

      console.error("Error extracting file:", error);
      throw error;
    }
  };

  const clearProgress = useCallback((fileName: string) => {
    setFileProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  }, []);

  const clearAllProgress = useCallback(() => {
    setFileProgress({});
  }, []);

  return {
    extractFile,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    fileProgress,
    clearProgress,
    clearAllProgress,
  };
}

/**
 * Hook for getting supported file types
 */
export function useSupportedFileTypes() {
  const { data, isLoading, isError, error } =
    trpc.fileExtractor.getSupportedFileTypes.useQuery();

  return {
    supportedTypes: data?.supportedTypes || [],
    isLoading,
    isError,
    error,
  };
}

/**
 * Hook for getting extraction statistics with auto-refresh
 */
export function useExtractionStats() {
  const { data, isLoading, isError, error, refetch } =
    trpc.fileExtractor.getExtractionStats.useQuery(undefined, {
      staleTime: 10 * 1000, // 10 seconds
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
    });

  return {
    stats: data?.stats,
    recentDocuments: data?.recentDocuments || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
