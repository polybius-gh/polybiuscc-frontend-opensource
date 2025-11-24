// system-variables.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SystemVariable } from './system-variable.type';

@Injectable({
  providedIn: 'root'
})
export class SystemVariablesService {
  constructor(private http: HttpClient) {}

  baseURL = '/api/system';

  getAll(type: string): Observable<SystemVariable[]> {
    return this.http.get<SystemVariable[]>(`${this.baseURL}/systemVariables/getAll/${type}`);
  }

  create(type: string, data: SystemVariable): Observable<SystemVariable> {
    return this.http.post<SystemVariable>(`${this.baseURL}/systemVariables/create`, data);
  }

  update(type: string, id: string, data: SystemVariable): Observable<SystemVariable> {
    return this.http.put<SystemVariable>(`${this.baseURL}/systemVariables/update/${id}`, data);
  }

  delete(type: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/systemVariables/delete/${id}`);
  }
}
