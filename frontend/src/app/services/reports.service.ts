import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Report, ReportFormat } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reports`;

  generate(surveyId: string, format: ReportFormat) {
    return this.http.post<Report>(this.base, { surveyId, format });
  }

  getBySurvey(surveyId: string) {
    return this.http.get<Report[]>(`${this.base}/survey/${surveyId}`);
  }

  downloadBlob(reportId: string) {
    return this.http.get(`${this.base}/${reportId}/download`, { responseType: 'blob' });
  }

  delete(reportId: string) {
    return this.http.delete(`${this.base}/${reportId}`);
  }

  softDelete(reportId: string) {
    return this.http.patch<void>(`${this.base}/${reportId}`, { deleted: true });
  }
}