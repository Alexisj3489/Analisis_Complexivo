import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SurveyQuestion, QuestionType, QuestionOption } from '../models/survey.model';

export interface CreateQuestionPayload {
  text: string;
  type: QuestionType;
  order?: number;
  required?: boolean;
  options?: { text: string; order?: number }[];
}

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  create(surveyId: string, payload: CreateQuestionPayload) {
    return this.http.post<SurveyQuestion>(
      `${this.base}/surveys/${surveyId}/questions`,
      payload,
    );
  }

  update(questionId: string, payload: Partial<CreateQuestionPayload>) {
    return this.http.put<SurveyQuestion>(`${this.base}/questions/${questionId}`, payload);
  }

  softDelete(questionId: string) {
    return this.http.patch<void>(`${this.base}/questions/${questionId}`, { deleted: true });
  }

  addOption(questionId: string, text: string, order?: number) {
    return this.http.post<QuestionOption>(`${this.base}/questions/${questionId}/options`, {
      text,
      order,
    });
  }

  updateOption(optionId: string, text: string) {
    return this.http.put<QuestionOption>(`${this.base}/options/${optionId}`, { text });
  }

  softDeleteOption(optionId: string) {
    return this.http.patch<void>(`${this.base}/options/${optionId}`, { deleted: true });
  }
}