import type { Metadata } from "next";
import { FileUploadZone } from "@/components/app/file-extractor/FileUploadZone";
import { FileExtractorStats } from "@/components/app/file-extractor/FileExtractorStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Home",
  description: "Home Page",
};

export default function DocumentsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Document Library</h1>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <FileUploadZone />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <FileExtractorStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
