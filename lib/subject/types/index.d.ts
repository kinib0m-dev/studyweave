export interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: SubjectColor;
  createdAt: Date;
}

export type SubjectColor =
  | "blue"
  | "green"
  | "purple"
  | "red"
  | "orange"
  | "yellow"
  | "pink"
  | "teal"
  | "indigo"
  | "gray";

export interface SubjectContextType {
  currentSubject: Subject | null;
  subjects: Subject[];
  isLoading: boolean;
  error: string | null;
  switchSubject: (subjectId: string) => Promise<void>;
  getCurrentSubject: () => Subject | null;
  refreshSubjects: () => void;
}

export interface SubjectStorageData {
  subjectId: string;
  timestamp: number;
}
