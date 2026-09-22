import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AppUser, CreateUserPayload } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AppUsersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  getAll() {
    return this.http.get<AppUser[]>(this.base);
  }

  create(payload: CreateUserPayload) {
    return this.http.post<AppUser>(this.base, payload);
  }

  update(id: string, payload: Partial<CreateUserPayload>) {
    return this.http.put<AppUser>(`${this.base}/${id}`, payload);
  }

  softDelete(id: string) {
    return this.http.patch<void>(`${this.base}/${id}`, { deleted: true });
  }
}