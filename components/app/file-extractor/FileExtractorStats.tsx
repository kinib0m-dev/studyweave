"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  TrendingUp,
  HardDrive,
  Clock,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-react";
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
import { useExtractionStats } from "@/lib/file-extractor/hooks/use-file-extractor";
import { useDeleteDocument } from "@/lib/docs/hooks/use-docs";
import { formatFileSize } from "@/lib/utils/file-utils";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

interface FileExtractorStatsProps {
  className?: string;
}

export function FileExtractorStats({ className }: FileExtractorStatsProps) {
  const { stats, recentDocuments, isLoading, error, refetch } =
    useExtractionStats();
  const { deleteDocument, isLoading: isDeleting } = useDeleteDocument();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

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
      refetch(); // Refresh the list
    } catch (error) {
      toast.error("Failed to delete document");
      console.error("Delete error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-destructive">Error loading statistics</p>
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
    <div className={className}>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Documents - Soft Blue */}
        <Card className="bg-slate-800/40 backdrop-blur-md border-slate-600/30 hover:bg-slate-800/50 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Total Documents
                </p>
                <p className="text-2xl font-bold text-slate-200">
                  {stats?.totalDocuments || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Words - Soft Green */}
        <Card className="bg-slate-800/40 backdrop-blur-md border-slate-600/30 hover:bg-slate-800/50 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Total Words
                </p>
                <p className="text-2xl font-bold text-slate-200">
                  {stats?.totalWords?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Storage - Soft Purple */}
        <Card className="bg-slate-800/40 backdrop-blur-md border-slate-600/30 hover:bg-slate-800/50 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Total Storage
                </p>
                <p className="text-2xl font-bold text-slate-200">
                  {formatFileSize(stats?.totalFileSize || 0)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <HardDrive className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Files - Soft Orange */}
        <Card className="bg-slate-800/40 backdrop-blur-md border-slate-600/30 hover:bg-slate-800/50 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Recent Files
                </p>
                <p className="text-2xl font-bold text-slate-200">
                  {recentDocuments.length}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      {recentDocuments.length > 0 && (
        <Card className="bg-slate-800/40 backdrop-blur-md border-slate-600/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-200">
                <Clock className="h-5 w-5 text-slate-400" />
                Recent Documents
                <Badge
                  variant="secondary"
                  className="bg-slate-700/50 text-slate-300"
                >
                  {recentDocuments.length}
                </Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-slate-600/40">
                      <FileText className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{doc.title}</p>
                      <p className="text-sm text-slate-400">{doc.fileName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-slate-400">
                        {formatDistanceToNow(new Date(doc.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1 bg-slate-700/30 border-slate-600/40 text-slate-300"
                      >
                        {doc.wordCount?.toLocaleString() || 0} words
                      </Badge>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800/95 border-slate-600/50 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-200">
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete &quot;{documentToDelete?.title}
              &quot;? This action cannot be undone.
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
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
