"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileProgressProps {
  fileName: string;
  progress: number;
  status: "reading" | "uploading" | "processing" | "completed" | "error";
  message?: string;
  onClear?: () => void;
  className?: string;
}

export function FileProgressBar({
  fileName,
  progress,
  status,
  message,
  onClear,
  className,
}: FileProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "reading":
      case "uploading":
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProgressStyle = () => {
    switch (status) {
      case "reading":
        return { "--progress-color": "rgb(59 130 246)" } as React.CSSProperties; // blue-500
      case "uploading":
        return { "--progress-color": "rgb(249 115 22)" } as React.CSSProperties; // orange-500
      case "processing":
        return { "--progress-color": "rgb(168 85 247)" } as React.CSSProperties; // purple-500
      case "completed":
        return { "--progress-color": "rgb(34 197 94)" } as React.CSSProperties; // green-500
      case "error":
        return { "--progress-color": "rgb(239 68 68)" } as React.CSSProperties; // red-500
      default:
        return {
          "--progress-color": "rgb(107 114 128)",
        } as React.CSSProperties; // gray-500
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case "completed":
        return "default" as const;
      case "error":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className={cn("p-4 border rounded-lg bg-card", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{fileName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {message || "Processing..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant()}>
            {status === "reading" && "Reading"}
            {status === "uploading" && "Uploading"}
            {status === "processing" && "Processing"}
            {status === "completed" && "Completed"}
            {status === "error" && "Error"}
          </Badge>

          {(status === "completed" || status === "error") && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div
          className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20"
          style={getProgressStyle()}
        >
          <div
            className="h-full transition-all duration-300 ease-in-out"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--progress-color)",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress}%</span>
          {status === "completed" && <span>✨ Ready to use</span>}
          {status === "error" && <span>❌ Failed</span>}
        </div>
      </div>
    </div>
  );
}
