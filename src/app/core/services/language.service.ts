import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Language } from '../models/language.model';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private apiUrl = 'http://localhost:8080/api/languages';

  constructor(private http: HttpClient) {}

  getAllLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(this.apiUrl);
  }

  getLanguageById(id: number): Observable<Language> {
    return this.http.get<Language>(`${this.apiUrl}/${id}`);
  }

  createLanguage(language: Language): Observable<Language> {
    return this.http.post<Language>(this.apiUrl, language);
  }

  updateLanguage(id: number, language: Language): Observable<Language> {
    return this.http.put<Language>(`${this.apiUrl}/${id}`, language);
  }

  deleteLanguage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
