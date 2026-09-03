export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'YES_NO'
  | 'SCALE_1_5'
  | 'RATING_1_5'
  | 'MULTIPLE_CHOICE'
  | 'FREQUENCY';

export type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface QuestionOption {
  id: string;
  text: string;
  order: number;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
  required: boolean;
  options: QuestionOption[];
}

export interface SurveyResponseSummary {
  id: string;
  respondent_ref: string | null;
  status: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'FALLIDO';
  source: 'WEB' | 'IMPORT';
  submitted_at: string;
  processed_at: string | null;
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  created_at: string;
  updated_at: string;
  questions: SurveyQuestion[];
  responses: SurveyResponseSummary[];
}

export interface CreateSurveyPayload {
  title: string;
  description?: string;
}