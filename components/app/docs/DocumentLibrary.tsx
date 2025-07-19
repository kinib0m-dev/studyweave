"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Trash2,
  RefreshCw,
  Loader2,
  CalendarDays,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDocuments, useDeleteDocument } from "@/lib/docs/hooks/use-docs";
import { formatFileSize } from "@/lib/utils/file-utils";
import { formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentLibraryProps {
  className?: string;
  subjectId?: string;
}

type SortOption = "newest" | "oldest" | "name" | "size";

export function DocumentLibrary({
  className,
  subjectId,
}: DocumentLibraryProps) {
  const { documents, isLoading, error, refetch } = useDocuments({ subjectId });
  const { deleteDocument, isLoading: isDeleting } = useDeleteDocument();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    const filtered = documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFileType =
        fileTypeFilter === "all" || doc.fileType?.includes(fileTypeFilter);

      return matchesSearch && matchesFileType;
    });

    // Sort documents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name":
          return a.title.localeCompare(b.title);
        case "size":
          return (b.fileSize || 0) - (a.fileSize || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents, searchQuery, sortBy, fileTypeFilter]);

  // Get unique file types for filter
  const fileTypes = useMemo(() => {
    const types = new Set(documents.map((doc) => doc.fileType).filter(Boolean));
    return Array.from(types);
  }, [documents]);

  const handleDeleteClick = (id: string, title: string) => {
    setDocumentToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete.id);
      toast.success("Document deleted successfully");
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete document");
      console.error("Delete error:", error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes("pdf")) return "🔴";
    if (fileType?.includes("word")) return "🔵";
    if (fileType?.includes("presentation")) return "🟠";
    if (fileType?.includes("spreadsheet")) return "🟢";
    return "📄";
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/40 backdrop-blur-md border-slate-600/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/40 backdrop-blur-md border-slate-600/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-red-400">Error loading documents</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="bg-slate-800/40 backdrop-blur-md border-slate-600/30">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-slate-200">
              <FileText className="h-5 w-5 text-slate-400" />
              Document Library
              <Badge
                variant="secondary"
                className="bg-slate-700/50 text-slate-300"
              >
                {filteredAndSortedDocuments.length}
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700/30 border-slate-600/40 text-slate-200 placeholder:text-slate-400 focus:border-slate-500/60"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(value: SortOption) => setSortBy(value)}
            >
              <SelectTrigger className="w-full sm:w-40 bg-slate-700/30 border-slate-600/40 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800/95 border-slate-600/50">
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-slate-700/30 border-slate-600/40 text-slate-200">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800/95 border-slate-600/50">
                <SelectItem value="all">All Types</SelectItem>
                {fileTypes.map((type) => (
                  <SelectItem key={type} value={type as string}>
                    {type?.split("/")[1]?.toUpperCase() || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents Grid */}
          {filteredAndSortedDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                {documents.length === 0
                  ? "No documents yet"
                  : "No documents found"}
              </h3>
              <p className="text-slate-400">
                {documents.length === 0
                  ? "Upload your first document to get started"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className="bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/40 transition-all duration-200 group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getFileIcon(doc.fileType || "")}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-medium text-slate-200 truncate">
                            {doc.title}
                          </h4>
                          <p className="text-sm text-slate-400 truncate">
                            {doc.fileName}
                          </p>
                        </div>
                      </div>
                      <Button
                        size={"icon"}
                        variant={"ghost"}
                        onClick={() => handleDeleteClick(doc.id, doc.title)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <CalendarDays className="h-3 w-3" />
                        {formatDistanceToNow(new Date(doc.createdAt), {
                          addSuffix: true,
                        })}
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="bg-slate-600/30 border-slate-500/40 text-slate-300 text-xs"
                        >
                          {doc.wordCount?.toLocaleString() || 0} words
                        </Badge>
                        {doc.fileSize && (
                          <span className="text-xs text-slate-400">
                            {formatFileSize(doc.fileSize)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800/95 border-slate-600/50 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete &quot;{documentToDelete?.title}
              &quot;? This action cannot be undone and will permanently remove
              the document from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600/80 hover:bg-red-600 text-white border-red-500/50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Document
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
