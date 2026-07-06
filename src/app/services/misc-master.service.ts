import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MiscMasterService {
  private apiUrl = 'http://localhost:3000/api/misc-master';

  constructor(private http: HttpClient) {}

  // Save Misc Master details
  saveMiscMaster(data: { type: string; name: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // Get Misc Master by type
  getMiscMasterByType(type: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${type}`);
  }

  // Get all Misc Masters
  getAllMiscMasters(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Delete Misc Master by ID
  deleteMiscMaster(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Update Misc Master by ID
  updateMiscMaster(id: number, data: { type: string; name: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
}
