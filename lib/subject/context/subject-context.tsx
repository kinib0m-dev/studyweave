"use client";

import { createContext, useContext } from "react";
import { SubjectContextType } from "../types";

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export function useSubject() {
  const context = useContext(SubjectContext);
  if (context === undefined) {
    throw new Error("useSubject must be used within an SubjectProvider");
  }
  return context;
}

export { SubjectContext };
