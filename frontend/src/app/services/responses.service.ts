import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AnswerPayload {
  questionId: string;
  optionId?: string;
  optionIds?: string[];
  value?: number | boolean;
}

@Injectable({ providedIn: 'root' })
export class ResponsesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  submit(surveyId: string, answers: AnswerPayload[], respondentRef?: string) {
    return this.http.post(`${this.base}/surveys/${surveyId}/responses`, {
      answers,
      respondentRef,
    });
  }

  getOne(id: string) {
    return this.http.get(`${this.base}/responses/${id}`);
  }

  retry(id: string) {
    return this.http.post(`${this.base}/responses/${id}/retry`, {});
  }
}