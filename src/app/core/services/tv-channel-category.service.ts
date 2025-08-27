import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TvChannelCategory } from '../models/tv-channel-category.model';

@Injectable({
  providedIn: 'root',
})
export class TvChannelCategoryService {
  private apiUrl = 'http://localhost:8080/api/categories';

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<TvChannelCategory[]> {
    return this.http.get<TvChannelCategory[]>(this.apiUrl);
  }

  getCategoryById(id: number): Observable<TvChannelCategory> {
    return this.http.get<TvChannelCategory>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: TvChannelCategory): Observable<TvChannelCategory> {
    return this.http.post<TvChannelCategory>(this.apiUrl, category);
  }

  updateCategory(
    id: number,
    category: TvChannelCategory
  ): Observable<TvChannelCategory> {
    return this.http.put<TvChannelCategory>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
