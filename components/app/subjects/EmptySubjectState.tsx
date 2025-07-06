"use client";

import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateSubjectDialog } from "./SubjectDialog";

interface EmptySubjectStateProps {
  variant?: "dashboard" | "sidebar" | "minimal";
  onCreateSubject?: () => void;
}

export function EmptySubjectState({
  variant = "dashboard",
  onCreateSubject,
}: EmptySubjectStateProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateClick = () => {
    setShowCreateDialog(true);
    onCreateSubject?.();
  };

  // Minimal variant for sidebar or compact spaces
  if (variant === "minimal") {
    return (
      <>
        <div className="text-center p-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-lg mb-3">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">No subjects yet</p>
          <Button size="sm" onClick={handleCreateClick} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create Subject
          </Button>
        </div>

        <CreateSubjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </>
    );
  }

  // Sidebar variant for navigation areas
  if (variant === "sidebar") {
    return (
      <>
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="text-center">
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No Subject
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Create one to get started
            </p>
            <Button size="sm" onClick={handleCreateClick} className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          </div>
        </div>

        <CreateSubjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </>
    );
  }

  // Full dashboard variant
  return (
    <>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>

          {/* Main Message */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Create Your First Subject
          </h2>

          {/* Action Button */}
          <Button size="lg" onClick={handleCreateClick} className="mb-8">
            <Plus className="w-5 h-5 mr-2" />
            Create Subject
          </Button>
        </div>
      </div>

      <CreateSubjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
