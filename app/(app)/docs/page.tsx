import type { Metadata } from "next";
import { FileUploadZone } from "@/components/app/file-extractor/FileUploadZone";
import { FileExtractorStats } from "@/components/app/file-extractor/FileExtractorStats";
import { DocumentLibrary } from "@/components/app/docs/DocumentLibrary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documents",
  description: "Upload and Manage Documents",
};

export default function DocumentsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-slate-800/60 backdrop-blur-md border-slate-600/40 text-slate-300 hover:bg-slate-700/60 hover:text-white hover:border-slate-500/60 transition-all duration-300"
          asChild
        >
          <Link href="/home" className="flex items-center gap-2">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Document Library</h1>
      </div>
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="library">Document Library</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <FileUploadZone />
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <DocumentLibrary />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <FileExtractorStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
