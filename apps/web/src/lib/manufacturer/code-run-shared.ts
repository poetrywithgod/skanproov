export interface CodeRun {
  id: string;
  runNo: number;
  batchId: string;
  batchNumber: string;
  productName: string;
  variant: string | null;
  quantity: number;
  generatedByName: string | null;
  createdAt: string;
  /** Null once the files have been deleted (after 30 days). */
  csvPath: string | null;
  pdfPath: string | null;
  filesExpireAt: string | null;
}
