"use client";

import { useCallback, useState } from "react";
import { useSubject } from "../context/subject-context";
import { Subject } from "../types";

/**
 * Hook for subject switching functionality
 */
export function useSubjectSwitcher() {
  const {
    currentSubject,
    subjects,
    switchSubject,
    isLoading,
    error,
    refreshSubjects,
  } = useSubject();

  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  /**
   * Switch to a different subject with error handling
   */
  const handleSwitchSubject = useCallback(
    async (subjectId: string) => {
      if (subjectId === currentSubject?.id) {
        return; // Already on this subject
      }

      setIsSwitching(true);
      setSwitchError(null);

      try {
        await switchSubject(subjectId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to switch subject";
        setSwitchError(errorMessage);
        throw err; // Re-throw for component handling
      } finally {
        setIsSwitching(false);
      }
    },
    [currentSubject?.id, switchSubject]
  );

  /**
   * Get subjects with additional metadata for UI
   */
  const getSubjectWithMetadata = useCallback(() => {
    return subjects.map((subject) => ({
      ...subject,
      isActive: subject.id === currentSubject?.id,
      canSwitch: subject.id !== currentSubject?.id,
      displayName: subject.name,
    }));
  }, [subjects, currentSubject?.id]);

  /**
   * Get available subjects (excludes current)
   */
  const getAvailableSubjects = useCallback(() => {
    return subjects.filter((subject) => subject.id !== currentSubject?.id);
  }, [subjects, currentSubject?.id]);

  /**
   * Search subjects by name
   */
  const searchSubjects = useCallback(
    (query: string) => {
      const lowercaseQuery = query.toLowerCase().trim();

      if (!lowercaseQuery) {
        return subjects;
      }

      return subjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(lowercaseQuery) ||
          subject.description?.toLowerCase().includes(lowercaseQuery)
      );
    },
    [subjects]
  );

  /**
   * Get recent subjects (based on joinedAt)
   */
  const getRecentSubjects = useCallback(
    (limit = 5) => {
      return [...subjects]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, limit);
    },
    [subjects]
  );

  /**
   * Clear switch error
   */
  const clearSwitchError = useCallback(() => {
    setSwitchError(null);
  }, []);

  /**
   * Refresh subjects list
   */
  const handleRefreshSubjects = useCallback(() => {
    setSwitchError(null);
    refreshSubjects();
  }, [refreshSubjects]);

  return {
    // Core state
    currentSubject,
    subjects,
    isLoading,
    error,

    // Switching state
    isSwitching,
    switchError,

    // Actions
    switchSubject: handleSwitchSubject,
    refreshSubjects: handleRefreshSubjects,
    clearSwitchError,

    // Utility functions
    getSubjectWithMetadata,
    getAvailableSubjects,
    searchSubjects,
    getRecentSubjects,

    // Computed values
    hasSubjects: subjects.length > 0,
    hasMultipleSubjects: subjects.length > 1,
    canSwitchSubjects: subjects.length > 1 && !isSwitching,
    subjectCount: subjects.length,
  };
}

/**
 * Hook for subject filtering and sorting
 */
export function useSubjectFilters() {
  const { subjects } = useSubject();

  /**
   * Filter subject by color
   */
  const filterByColor = useCallback(
    (color: string) => {
      return subjects.filter((subject) => subject.color === color);
    },
    [subjects]
  );

  /**
   * Sort subjects by various criteria
   */
  const sortSubjects = useCallback(
    (
      subjects: Subject[],
      sortBy: "name" | "createdAt" = "name",
      direction: "asc" | "desc" = "asc"
    ) => {
      const sorted = [...subjects].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "createdAt":
            comparison =
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
        }

        return direction === "desc" ? -comparison : comparison;
      });

      return sorted;
    },
    []
  );

  return {
    filterByColor,
    sortSubjects,
  };
}
