export type ReportFormat = 'XLSX' | 'PDF';

export interface Report {
  id: string;
  format: ReportFormat;
  file_path: string;
  created_at: string;
  general_average: number | null;
}