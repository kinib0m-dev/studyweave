"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  File,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useFileExtractor,
  useSupportedFileTypes,
} from "@/lib/file-extractor/hooks/use-file-extractor";
import {
  supportedFileTypes,
  MAX_FILE_SIZE,
  ClientFileSchema,
} from "@/lib/file-extractor/validation/file-extraction-schema";
import { formatFileSize } from "@/lib/utils/file-utils";
import { FileProgressBar } from "./FileProgressBar";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onSuccess?: (result: {
    success: boolean;
    document: unknown;
    extractedResult: {
      wordCount: number;
      pageCount?: number;
      fileSize: number;
      fileType: string;
    };
  }) => void;
  subjectId?: string;
  className?: string;
}

export function FileUploadZone({
  onSuccess,
  subjectId,
  className,
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});

  const {
    extractFile,
    isLoading,
    fileProgress,
    clearProgress,
    clearAllProgress,
  } = useFileExtractor();
  const { supportedTypes } = useSupportedFileTypes();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `File "${file.name}" is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
        );
        return false;
      }

      if (
        !supportedFileTypes.includes(
          file.type as (typeof supportedFileTypes)[number]
        )
      ) {
        toast.error(`File type "${file.type}" is not supported.`);
        return false;
      }

      return true;
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: supportedFileTypes.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>
    ),
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (fileToRemove: File) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
    setTitles((prev) => {
      const newTitles = { ...prev };
      delete newTitles[fileToRemove.name];
      return newTitles;
    });
    clearProgress(fileToRemove.name);
  };

  const updateTitle = (fileName: string, title: string) => {
    setTitles((prev) => ({ ...prev, [fileName]: title }));
  };

  const processFile = async (file: File) => {
    try {
      const fileData: ClientFileSchema = {
        file,
        title: titles[file.name] || file.name.replace(/\.[^/.]+$/, ""),
        subjectId,
      };

      const result = await extractFile(fileData);

      // Remove processed file from list
      setFiles((prev) => prev.filter((f) => f.name !== file.name));
      setTitles((prev) => {
        const newTitles = { ...prev };
        delete newTitles[file.name];
        return newTitles;
      });

      onSuccess?.(result);
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  const processAllFiles = async () => {
    for (const file of files) {
      await processFile(file);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf"))
      return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes("word"))
      return <FileText className="h-8 w-8 text-blue-500" />;
    if (fileType.includes("presentation"))
      return <FileText className="h-8 w-8 text-orange-500" />;
    if (fileType.includes("spreadsheet"))
      return <FileText className="h-8 w-8 text-green-500" />;
    if (fileType.includes("text"))
      return <FileText className="h-8 w-8 text-gray-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const isFileProcessing = (fileName: string) => {
    const progress = fileProgress[fileName];
    return (
      progress &&
      ["reading", "uploading", "processing"].includes(progress.status)
    );
  };

  const hasCompletedFiles = Object.values(fileProgress).some(
    (p) => p.status === "completed"
  );
  const hasErrorFiles = Object.values(fileProgress).some(
    (p) => p.status === "error"
  );
  const processingCount = Object.values(fileProgress).filter((p) =>
    ["reading", "uploading", "processing"].includes(p.status)
  ).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Zone */}
      <Card className="border-2 border-dashed transition-colors hover:border-primary/50">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={cn(
              "cursor-pointer text-center transition-colors",
              isDragActive && "text-primary"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? "Drop files here" : "Upload Documents"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, Word, PowerPoint, Text, CSV, Excel
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {Object.keys(fileProgress).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Loader2
                  className={cn(
                    "h-5 w-5",
                    processingCount > 0
                      ? "animate-spin text-blue-500"
                      : "text-green-500"
                  )}
                />
                File Processing
                {processingCount > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({processingCount} in progress)
                  </span>
                )}
              </CardTitle>

              <div className="flex items-center gap-2">
                {hasCompletedFiles && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Files ready</span>
                  </div>
                )}
                {hasErrorFiles && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Some failed</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllProgress}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(fileProgress).map((progress) => (
              <FileProgressBar
                key={progress.fileName}
                fileName={progress.fileName}
                progress={progress.progress}
                status={progress.status}
                message={progress.message}
                onClear={() => clearProgress(progress.fileName)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Files to Process</CardTitle>
              <Button
                onClick={processAllFiles}
                disabled={isLoading || files.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Process All Files ({files.length})
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file) => {
              const isProcessing = isFileProcessing(file.name);

              return (
                <div
                  key={file.name}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg transition-colors",
                    isProcessing
                      ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                      : "bg-muted/30"
                  )}
                >
                  {getFileIcon(file.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium truncate">{file.name}</p>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {formatFileSize(file.size)}
                      </span>
                      {isProcessing && (
                        <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                          Processing...
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <Label
                          htmlFor={`title-${file.name}`}
                          className="text-xs"
                        >
                          Document Title
                        </Label>
                        <Input
                          id={`title-${file.name}`}
                          placeholder="Enter document title..."
                          value={
                            titles[file.name] ||
                            file.name.replace(/\.[^/.]+$/, "")
                          }
                          onChange={(e) =>
                            updateTitle(file.name, e.target.value)
                          }
                          className="h-8 text-sm"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isProcessing ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processing...</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => processFile(file)}
                      >
                        <Upload className="h-4 w-4" />
                        Process
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      disabled={isProcessing}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Supported File Types */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Supported File Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {supportedTypes.map((type) => (
              <div
                key={type.type}
                className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
              >
                {getFileIcon(type.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{type.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {type.extension}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
