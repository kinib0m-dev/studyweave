"use client";

import { SubjectColor } from "@/lib/subject/types";
import { getSubjectColor } from "@/lib/subject/utils/subject-utils";
import { cn } from "@/lib/utils";

interface SubjectBadgeProps {
  name: string;
  color: SubjectColor;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

export function SubjectBadge({
  name,
  color,
  size = "md",
  className,
}: SubjectBadgeProps) {
  const orgColor = getSubjectColor(color);

  return (
    <div
      className={cn(
        "rounded flex-shrink-0 flex items-center justify-center text-white font-semibold",
        orgColor.bg,
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
