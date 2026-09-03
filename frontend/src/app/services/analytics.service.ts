import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { QuestionAnalytics, ImportSummary } from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getBySurvey(surveyId: string) {
    return this.http.get<QuestionAnalytics[]>(`${this.base}/surveys/${surveyId}/analytics`);
  }

  importFile(surveyId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportSummary>(`${this.base}/surveys/${surveyId}/import`, formData);
  }
}