// Type definitions for LangChain document loaders
export interface LangChainDocument {
  pageContent: string;
  metadata: Record<string, unknown>;
}

export interface DocumentLoader {
  load(): Promise<LangChainDocument[]>;
}

export interface PDFLoaderConstructor {
  new (file: File): DocumentLoader;
}

export interface DocxLoaderConstructor {
  new (file: File): DocumentLoader;
}

export interface PPTXLoaderConstructor {
  new (file: File): DocumentLoader;
}

export interface CSVLoaderConstructor {
  new (file: File): DocumentLoader;
}

export interface TextLoaderConstructor {
  new (file: File): DocumentLoader;
}

// XLSX types
export interface XLSXWorkbook {
  SheetNames: string[];
  Sheets: Record<string, XLSXWorksheet>;
}

export interface XLSXWorksheet {
  [key: string]: unknown;
}

export interface XLSXModule {
  read(data: ArrayBuffer, options: { type: string }): XLSXWorkbook;
  utils: {
    sheet_to_csv(worksheet: XLSXWorksheet): string;
  };
}
