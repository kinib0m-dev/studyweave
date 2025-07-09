import { z } from "zod";

// Supported file types
export const supportedFileTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "text/plain", // .txt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.ms-powerpoint", // .ppt
  "text/csv", // .csv
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/markdown", // .md
  "application/rtf", // .rtf
] as const;

type SupportedFileType = (typeof supportedFileTypes)[number];

// File extension mapping
export const fileExtensionMap: Record<SupportedFileType, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/msword": ".doc",
  "text/plain": ".txt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
  "application/vnd.ms-powerpoint": ".ppt",
  "text/csv": ".csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls",
  "text/markdown": ".md",
  "application/rtf": ".rtf",
};

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Helper function to check if file type is supported
function isSupportedFileType(fileType: string): fileType is SupportedFileType {
  return supportedFileTypes.includes(fileType as SupportedFileType);
}

// Schema for tRPC procedure (using base64 encoded file data)
export const extractFileSchema = z.object({
  fileName: z.string().min(1, { message: "File name is required" }),
  fileType: z.string().refine(isSupportedFileType, {
    message: "File type not supported",
  }),
  fileSize: z.number().max(MAX_FILE_SIZE, {
    message: "File size must be less than 10MB",
  }),
  fileData: z.string().min(1, { message: "File data is required" }), // base64 encoded
  title: z.string().min(1, { message: "Title is required" }).optional(),
  subjectId: z.string().uuid().optional(),
});

export type ExtractFileSchema = z.infer<typeof extractFileSchema>;

// Client-side file validation schema (with actual File object)
export const clientFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "File size must be less than 10MB",
    })
    .refine((file) => isSupportedFileType(file.type), {
      message: "File type not supported",
    }),
  title: z.string().min(1, { message: "Title is required" }).optional(),
  subjectId: z.string().uuid().optional(),
});

export type ClientFileSchema = z.infer<typeof clientFileSchema>;

// File extraction result
export const extractedFileSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  extractedText: z.string(),
  pageCount: z.number().optional(),
  wordCount: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type ExtractedFileResult = z.infer<typeof extractedFileSchema>;

// Helper to check if enhanced extraction is available for a file type
export function hasEnhancedExtraction(fileType: string): boolean {
  const enhancedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
  ];

  return enhancedTypes.includes(fileType);
}
