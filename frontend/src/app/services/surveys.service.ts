import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Survey, CreateSurveyPayload } from '../models/survey.model';

@Injectable({ providedIn: 'root' })
export class SurveysService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/surveys`;

  getAll(query?: { title?: string; status?: string; date?: string }) {
    let params = new HttpParams();
    if (query?.title) {
      params = params.set('title', query.title);
    }
    if (query?.status) {
      params = params.set('status', query.status);
    }
    if (query?.date) {
      params = params.set('date', query.date);
    }
    return this.http.get<Survey[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<Survey>(`${this.base}/${id}`);
  }

  create(payload: CreateSurveyPayload) {
    return this.http.post<Survey>(this.base, payload);
  }

  update(id: string, payload: Partial<CreateSurveyPayload>) {
    return this.http.put<Survey>(`${this.base}/${id}`, payload);
  }

  updateStatus(id: string, status: string) {
    return this.http.put<Survey>(`${this.base}/${id}/status`, { status });
  }

  softDelete(id: string) {
    return this.http.patch<void>(`${this.base}/${id}`, { deleted: true });
  }

  publish(id: string) {
    return this.http.post<Survey>(`${this.base}/${id}/publish`, {});
  }
}