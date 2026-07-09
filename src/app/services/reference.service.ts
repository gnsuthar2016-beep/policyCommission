import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReferenceService {
  private apiUrl = 'https://policy-api.alluresofttech.com/api/reference';

  constructor(private http: HttpClient) {}

  // Save Reference
  saveReference(data: { 
    name: string; 
    mobileNumber: string;
    alternativeMobileNumber?: string;
    emailId: string;
    dateOfBirth?: string;
    remark?: string;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // Get References with optional pagination and search
  getAllReferences(fetchAll: boolean = false): Observable<any> {
    return this.getReferences(1, fetchAll ? undefined : 10, undefined, fetchAll);
  }

  getReferences(page?: number, limit?: number, search?: string, fetchAll: boolean = false): Observable<any> {
    const params: any = {};
    if (page != null) {
      params.page = page;
    }
    if (limit != null) {
      params.limit = limit;
    }
    if (search != null && search !== '') {
      params.search = search;
    }
    if (fetchAll) {
      params.fetchAll = 'true';
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  // Get Reference by ID
  getReferenceById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Delete Reference by ID
  deleteReference(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Update Reference by ID
  updateReference(id: number, data: { 
    name: string; 
    mobileNumber: string;
    alternativeMobileNumber?: string;
    emailId: string;
    dateOfBirth?: string;
    remark?: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
}
