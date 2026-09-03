import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Survey, CreateSurveyPayload } from '../models/survey.model';

@Injectable({ providedIn: 'root' })
export class SurveysService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/surveys`;

  getAll() {
    return this.http.get<Survey[]>(this.base);
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