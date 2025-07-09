"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSubject } from "@/lib/subject/context/subject-context";
import { getSubjectColor } from "@/lib/subject/utils/subject-utils";
import { CreateSubjectDialog } from "./SubjectDialog";

export function SubjectSwitcher() {
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { currentSubject, subjects, switchSubject, isLoading } = useSubject();

  const handleSubjectSelect = async (subjectId: string) => {
    if (subjectId === currentSubject?.id) {
      setOpen(false);
      return;
    }

    try {
      await switchSubject(subjectId);
      setOpen(false);
    } catch (error) {
      console.error("Failed to switch subject:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  if (!currentSubject) {
    return (
      <div className="flex items-center gap-2 p-2 text-muted-foreground">
        <Building2 className="h-5 w-5" />
        <span className="text-sm font-medium">No subject</span>
      </div>
    );
  }

  const currentSubjectColor = getSubjectColor(currentSubject.color);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            aria-label="Select subject"
            className="w-full justify-between h-10 px-3 bg-muted/50 hover:bg-muted"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "h-6 w-6 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold",
                  currentSubjectColor.bg
                )}
              >
                {currentSubject.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {currentSubject.name}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="center">
          <Command>
            <CommandInput placeholder="Search subjects..." />
            <CommandList>
              <CommandEmpty>No subjects found.</CommandEmpty>
              <CommandGroup heading="Subjects">
                {subjects.map((subject) => {
                  const subjectColor = getSubjectColor(subject.color);
                  const isSelected = subject.id === currentSubject?.id;

                  return (
                    <CommandItem
                      key={subject.id}
                      value={subject.name}
                      onSelect={() => handleSubjectSelect(subject.id)}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={cn(
                          "h-5 w-5 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold",
                          subjectColor.bg
                        )}
                      >
                        {subject.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {subject.name}
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowCreateDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="h-5 w-5 rounded border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                    <Plus className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Create subject</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateSubjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
