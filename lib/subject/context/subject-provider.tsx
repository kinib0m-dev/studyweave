"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/trpc/client";
import { SubjectContext } from "./subject-context";
import { Subject, SubjectStorageData } from "../types";

const STORAGE_KEY = "studyweave_current_subject";
const STORAGE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface SubjectProviderProps {
  children: React.ReactNode;
}

export function SubjectProvider({ children }: SubjectProviderProps) {
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's subjects
  const {
    data: subjectData,
    isLoading,
    refetch: refreshSubjects,
  } = trpc.subject.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const subjects = useMemo(
    () => subjectData?.subjects || [],
    [subjectData?.subjects]
  );

  // Load subject from localStorage
  const loadStoredSubject = useCallback(() => {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: SubjectStorageData = JSON.parse(stored);

      // Check if stored data is expired
      if (Date.now() - data.timestamp > STORAGE_EXPIRY) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return data.subjectId;
    } catch (error) {
      console.error("Error loading stored subject:", error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  // Save subject to localStorage
  const saveSubjectToStorage = useCallback((subjectId: string) => {
    if (typeof window === "undefined") return;

    try {
      const data: SubjectStorageData = {
        subjectId,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving subject to storage:", error);
    }
  }, []);

  // Switch to a different subject
  const switchSubject = useCallback(
    async (subjectId: string) => {
      try {
        setError(null);

        // Find the organization in the user's list
        const targetSubject = subjects.find((sub) => sub.id === subjectId);

        if (!targetSubject) {
          throw new Error("Subject not found");
        }

        // Set as current subject
        setCurrentSubject(targetSubject);

        // Save to localStorage
        saveSubjectToStorage(subjectId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to switch subject";
        setError(message);
        console.error("Error switching subject:", err);
      }
    },
    [subjects, saveSubjectToStorage]
  );

  // Get current subject
  const getCurrentSubject = useCallback(() => {
    return currentSubject;
  }, [currentSubject]);

  // Initialize current subject when subjects are loaded
  useEffect(() => {
    if (!subjects.length || currentSubject) return;

    const storedSubId = loadStoredSubject();

    if (storedSubId) {
      // Try to set the stored subject
      const storedSub = subjects.find((sub) => sub.id === storedSubId);
      if (storedSub) {
        setCurrentSubject(storedSub);
        return;
      }
    }

    // Fallback to first subject if no stored sub or stored sub not found
    if (subjects.length > 0) {
      const firstSubject = subjects[0];
      setCurrentSubject(firstSubject);
      saveSubjectToStorage(firstSubject.id);
    }
  }, [subjects, currentSubject, loadStoredSubject, saveSubjectToStorage]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      currentSubject,
      subjects,
      isLoading,
      error,
      switchSubject,
      getCurrentSubject,
      refreshSubjects: () => refreshSubjects(),
    }),
    [
      currentSubject,
      subjects,
      isLoading,
      error,
      switchSubject,
      getCurrentSubject,
      refreshSubjects,
    ]
  );

  return (
    <SubjectContext.Provider value={contextValue}>
      {children}
    </SubjectContext.Provider>
  );
}
