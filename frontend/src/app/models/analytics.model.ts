import { SurveyQuestion } from './survey.model';

export interface QuestionAnalytics {
  id: string;
  question: SurveyQuestion;
  total_responses: number;
  frequency_table: Record<string, number>;
  percentage_table: Record<string, number>;
  average: number | null;
  mode: (string | number)[];
  min: number | null;
  max: number | null;
  calculated_at: string;
}
export interface ImportError {
  row: number;
  message: string;
}

export interface ImportSummary {
  totalRows: number;
  imported: number;
  failed: number;
  errors: ImportError[];
}