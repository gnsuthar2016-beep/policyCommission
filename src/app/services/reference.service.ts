import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReferenceService {
  private apiUrl = 'http://localhost:3000/api/reference';

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

  // Get all References
  getAllReferences(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
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
