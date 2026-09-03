import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private http = inject(HttpClient);

  checkSurveys() {
    return this.http.get(`${environment.apiUrl}/surveys`);
  }
}