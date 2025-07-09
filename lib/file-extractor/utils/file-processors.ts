import { ExtractedFileResult } from "../validation/file-extraction-schema";

// Type definitions for LangChain documents
interface LangChainDocument {
  pageContent: string;
  metadata: Record<string, unknown>;
}

interface DocumentLoader {
  load(): Promise<LangChainDocument[]>;
}

interface PDFLoaderConstructor {
  new (file: File): DocumentLoader;
}

interface DocxLoaderConstructor {
  new (file: File): DocumentLoader;
}

interface PPTXLoaderConstructor {
  new (file: File): DocumentLoader;
}

interface CSVLoaderConstructor {
  new (file: File): DocumentLoader;
}

// Check if we're running on the server
const isServer = typeof window === "undefined";

// Properly typed loader variables
let PDFLoader: PDFLoaderConstructor | null = null;
let DocxLoader: DocxLoaderConstructor | null = null;
let PPTXLoader: PPTXLoaderConstructor | null = null;
let CSVLoader: CSVLoaderConstructor | null = null;

// Dynamic imports with correct typing - only on server
const initializeLoaders = async (): Promise<void> => {
  // Only initialize loaders on the server side
  if (!isServer) {
    console.warn(
      "File processing loaders can only be initialized on the server side"
    );
    return;
  }

  try {
    const pdfModule = (await import(
      "@langchain/community/document_loaders/fs/pdf"
    )) as {
      PDFLoader: PDFLoaderConstructor;
    };
    PDFLoader = pdfModule.PDFLoader;
  } catch (error) {
    console.warn("PDF loader not available:", error);
  }

  try {
    const docxModule = (await import(
      "@langchain/community/document_loaders/fs/docx"
    )) as {
      DocxLoader: DocxLoaderConstructor;
    };
    DocxLoader = docxModule.DocxLoader;
  } catch (error) {
    console.warn("DOCX loader not available:", error);
  }

  try {
    const pptxModule = (await import(
      "@langchain/community/document_loaders/fs/pptx"
    )) as {
      PPTXLoader: PPTXLoaderConstructor;
    };
    PPTXLoader = pptxModule.PPTXLoader;
  } catch (error) {
    console.warn("PPTX loader not available:", error);
  }

  try {
    const csvModule = (await import(
      "@langchain/community/document_loaders/fs/csv"
    )) as {
      CSVLoader: CSVLoaderConstructor;
    };
    CSVLoader = csvModule.CSVLoader;
  } catch (error) {
    console.warn("CSV loader not available:", error);
  }
};

// XLSX types
interface XLSXWorkbook {
  SheetNames: string[];
  Sheets: Record<string, XLSXWorksheet>;
}

interface XLSXWorksheet {
  [key: string]: unknown;
}

interface XLSXModule {
  read(data: ArrayBuffer, options: { type: string }): XLSXWorkbook;
  utils: {
    sheet_to_csv(worksheet: XLSXWorksheet): string;
  };
}

// Add a helper to convert base64 to File
const base64ToFile = (
  base64Data: string,
  fileName: string,
  fileType: string
): File => {
  // Remove data URL prefix if present
  const base64 = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;

  // Convert base64 to binary
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: fileType });
};

// Text extraction utility
export class FileTextExtractor {
  private static initialized = false;

  private static async ensureInitialized(): Promise<void> {
    if (!isServer) {
      throw new Error("File processing can only be done on the server side");
    }

    if (!this.initialized) {
      await initializeLoaders();
      this.initialized = true;
    }
  }

  private static countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private static cleanText(text: string): string {
    // Remove excessive whitespace and normalize line breaks
    return text
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();
  }

  // Fallback text extraction for when LangChain loaders aren't available
  private static async extractTextFallback(file: File): Promise<string> {
    if (file.type === "text/plain" || file.type === "text/markdown") {
      return await file.text();
    }

    if (file.type === "text/csv") {
      const text = await file.text();
      // Convert CSV to readable text format
      const lines = text.split("\n");
      const headers = lines[0]?.split(",") || [];
      let result = `Headers: ${headers.join(" | ")}\n\n`;

      for (let i = 1; i < Math.min(lines.length, 100); i++) {
        // Limit to first 100 rows
        const row = lines[i]?.split(",") || [];
        result += `Row ${i}: ${row.join(" | ")}\n`;
      }

      return result;
    }

    // For other file types, try to read as text (might not work well for binary files)
    try {
      return await file.text();
    } catch {
      throw new Error(
        `Cannot extract text from ${file.type} files without proper dependencies`
      );
    }
  }

  static async extractFromPDF(file: File): Promise<ExtractedFileResult> {
    await this.ensureInitialized();

    if (!PDFLoader) {
      throw new Error(
        'PDF extraction requires the "pdf-parse" package. Please install it: bun add pdf-parse'
      );
    }

    try {
      const loader = new PDFLoader(file);
      const docs: LangChainDocument[] = await loader.load();

      const extractedText = docs.map((doc) => doc.pageContent).join("\n\n");
      const cleanedText = this.cleanText(extractedText);

      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedText: cleanedText,
        pageCount: docs.length,
        wordCount: this.countWords(cleanedText),
        metadata: {
          originalFileName: file.name,
          extractedAt: new Date().toISOString(),
          loader: "PDFLoader",
          documentMetadata: docs.map((doc) => doc.metadata),
        },
      };
    } catch (error) {
      console.error("Error extracting from PDF:", error);
      throw new Error(
        "Failed to extract text from PDF file. Please ensure pdf-parse is installed."
      );
    }
  }

  static async extractFromDocx(file: File): Promise<ExtractedFileResult> {
    await this.ensureInitialized();

    if (!DocxLoader) {
      throw new Error(
        'DOCX extraction requires the "mammoth" package. Please install it: bun add mammoth'
      );
    }

    try {
      const loader = new DocxLoader(file);
      const docs: LangChainDocument[] = await loader.load();

      const extractedText = docs.map((doc) => doc.pageContent).join("\n\n");
      const cleanedText = this.cleanText(extractedText);

      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedText: cleanedText,
        wordCount: this.countWords(cleanedText),
        metadata: {
          originalFileName: file.name,
          extractedAt: new Date().toISOString(),
          loader: "DocxLoader",
          documentMetadata: docs.map((doc) => doc.metadata),
        },
      };
    } catch (error) {
      console.error("Error extracting from DOCX:", error);
      throw new Error(
        "Failed to extract text from DOCX file. Please ensure mammoth is installed."
      );
    }
  }

  static async extractFromPptx(file: File): Promise<ExtractedFileResult> {
    await this.ensureInitialized();

    if (!PPTXLoader) {
      throw new Error(
        'PPTX extraction requires the "officeparser" package. Please install it: bun add officeparser'
      );
    }

    try {
      const loader = new PPTXLoader(file);
      const docs: LangChainDocument[] = await loader.load();

      const extractedText = docs.map((doc) => doc.pageContent).join("\n\n");
      const cleanedText = this.cleanText(extractedText);

      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedText: cleanedText,
        pageCount: docs.length,
        wordCount: this.countWords(cleanedText),
        metadata: {
          originalFileName: file.name,
          extractedAt: new Date().toISOString(),
          loader: "PPTXLoader",
          slideCount: docs.length,
          documentMetadata: docs.map((doc) => doc.metadata),
        },
      };
    } catch (error) {
      console.error("Error extracting from PPTX:", error);
      throw new Error(
        "Failed to extract text from PPTX file. Please ensure officeparser is installed."
      );
    }
  }

  static async extractFromCsv(file: File): Promise<ExtractedFileResult> {
    await this.ensureInitialized();

    try {
      let extractedText: string;
      let documentMetadata: Record<string, unknown>[] = [];

      if (CSVLoader) {
        const loader = new CSVLoader(file);
        const docs: LangChainDocument[] = await loader.load();
        extractedText = docs.map((doc) => doc.pageContent).join("\n");
        documentMetadata = docs.map((doc) => doc.metadata);
      } else {
        // Fallback CSV parsing
        extractedText = await this.extractTextFallback(file);
      }

      const cleanedText = this.cleanText(extractedText);

      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedText: cleanedText,
        wordCount: this.countWords(cleanedText),
        metadata: {
          originalFileName: file.name,
          extractedAt: new Date().toISOString(),
          loader: CSVLoader ? "CSVLoader" : "Fallback",
          documentMetadata,
        },
      };
    } catch (error) {
      console.error("Error extracting from CSV:", error);
      throw new Error("Failed to extract text from CSV file");
    }
  }

  static async extractFromText(file: File): Promise<ExtractedFileResult> {
    try {
      const text = await file.text();
      const cleanedText = this.cleanText(text);

      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedText: cleanedText,
        wordCount: this.countWords(cleanedText),
        metadata: {
          originalFileName: file.name,
          extractedAt: new Date().toISOString(),
          loader: "TextLoader",
          encoding: "utf-8",
        },
      };
    } catch (error) {
      console.error("Error extracting from text file:", error);
      throw new Error("Failed to extract text from text file");
    }
  }

  // Excel extraction using xlsx library - only on server
  static async extractFromExcel(file: File): Promise<ExtractedFileResult> {
    if (!isServer) {
      throw new Error("Excel extraction can only be done on the server side");
    }

    try {
      // Try to use xlsx library if available
      try {
        const XLSX = (await import("xlsx")) as XLSXModule;
        const arrayBuffer = await file.arrayBuffer();
        const workbook: XLSXWorkbook = XLSX.read(arrayBuffer, {
          type: "array",
        });

        let extractedText = "";
        const sheets: string[] = [];

        workbook.SheetNames.forEach((sheetName, index) => {
          const worksheet = workbook.Sheets[sheetName];
          if (worksheet) {
            const csvData = XLSX.utils.sheet_to_csv(worksheet);
            sheets.push(sheetName);

            extractedText += `Sheet: ${sheetName}\n`;
            extractedText += csvData;

            if (index < workbook.SheetNames.length - 1) {
              extractedText += "\n\n---\n\n";
            }
          }
        });

        const cleanedText = this.cleanText(extractedText);

        return {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          extractedText: cleanedText,
          wordCount: this.countWords(cleanedText),
          metadata: {
            originalFileName: file.name,
            extractedAt: new Date().toISOString(),
            loader: "XLSX",
            sheetNames: sheets,
            sheetCount: sheets.length,
          },
        };
      } catch (xlsxError) {
        // Fallback if xlsx is not available
        const extractedText = `Excel file: ${file.name}\nThis file contains spreadsheet data that requires the 'xlsx' library for proper extraction.\nFile size: ${file.size} bytes\n\nTo extract content from Excel files, install: bun add xlsx`;

        return {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          extractedText: extractedText,
          wordCount: this.countWords(extractedText),
          metadata: {
            originalFileName: file.name,
            extractedAt: new Date().toISOString(),
            loader: "BasicFallback",
            note: "Install xlsx package for better Excel extraction",
            error:
              xlsxError instanceof Error ? xlsxError.message : "Unknown error",
          },
        };
      }
    } catch (error) {
      console.error("Error extracting from Excel file:", error);
      throw new Error("Failed to extract text from Excel file");
    }
  }

  // Update the main extraction method to handle both File objects and base64 data
  static async extractFromFile(file: File): Promise<ExtractedFileResult>;
  static async extractFromFile(
    base64Data: string,
    fileName: string,
    fileType: string
  ): Promise<ExtractedFileResult>;
  static async extractFromFile(
    fileOrBase64: File | string,
    fileName?: string,
    fileType?: string
  ): Promise<ExtractedFileResult> {
    let file: File;

    if (typeof fileOrBase64 === "string") {
      // Handle base64 data
      if (!fileName || !fileType) {
        throw new Error(
          "fileName and fileType are required when using base64 data"
        );
      }
      file = base64ToFile(fileOrBase64, fileName, fileType);
    } else {
      // Handle File object
      file = fileOrBase64;
    }

    switch (file.type) {
      case "application/pdf":
        return this.extractFromPDF(file);

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      case "application/msword":
        return this.extractFromDocx(file);

      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      case "application/vnd.ms-powerpoint":
        return this.extractFromPptx(file);

      case "text/csv":
        return this.extractFromCsv(file);

      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      case "application/vnd.ms-excel":
        return this.extractFromExcel(file);

      case "text/plain":
      case "text/markdown":
      case "application/rtf":
        return this.extractFromText(file);

      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  }
}
