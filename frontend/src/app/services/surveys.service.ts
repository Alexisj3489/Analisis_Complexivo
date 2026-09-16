import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Survey, CreateSurveyPayload } from '../models/survey.model';

@Injectable({ providedIn: 'root' })
export class SurveysService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/surveys`;

  getAll(query?: { title?: string }) {
    let params = new HttpParams();
    if (query?.title) {
      params = params.set('title', query.title);
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

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  publish(id: string) {
    return this.http.post<Survey>(`${this.base}/${id}/publish`, {});
  }
}