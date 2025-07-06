"use client";

import { useSubject } from "../context/subject-context";
import { Subject } from "../types";

/**
 * Hook to get the current subject and related utilities
 */
export function useCurrentSubject() {
  const { currentSubject, isLoading, error, getCurrentSubject } = useSubject();

  return {
    /**
     * Current active subject, null if none selected
     */
    subject: currentSubject,

    /**
     * Subject ID shorthand for convenience
     */
    subjectId: currentSubject?.id || null,

    /**
     * Loading state for subject data
     */
    isLoading,

    /**
     * Error state for subject operations
     */
    error,

    /**
     * Get current subject (same as subject, for backwards compatibility)
     */
    getCurrentSubject,

    /**
     * Whether a current subject is selected
     */
    hasSubject: !!currentSubject,

    /**
     * Subject display name for UI
     */
    subjectName: currentSubject?.name || "No Subject",

    /**
     * Subject color for theming
     */
    subjectColor: currentSubject?.color || "blue",
  };
}

/**
 * Hook for subject-specific operations that gracefully handle missing subjects
 */
export function useSubjectContext() {
  const context = useCurrentSubject();

  /**
   * Execute a callback only if an subject is selected
   */
  const withSubject = <T>(
    callback: (subject: Subject) => T,
    fallback?: T
  ): T | undefined => {
    if (context.subject) {
      return callback(context.subject);
    }
    return fallback;
  };

  /**
   * Get subject-scoped data for tRPC calls
   */
  const getSubjectScopedInput = <T extends Record<string, unknown>>(
    input: T
  ): (T & { subjectId: string }) | null => {
    if (!context.subjectId) {
      return null;
    }
    return {
      ...input,
      subjectId: context.subjectId,
    };
  };

  return {
    ...context,
    withSubject,
    getSubjectScopedInput,
  };
}
