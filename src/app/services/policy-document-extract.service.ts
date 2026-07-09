import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PolicyDocumentExtractService {
  private apiUrl = 'https://policy-api.alluresofttech.com/api/extract-policy';

  constructor(private http: HttpClient) { }

  /**
   * Extract policy details from a document file
   * @param file The policy document file
   * @returns Observable with extracted policy details
   */
  extractPolicyDetails(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('policyDoc', file);
    
    return this.http.post<any>(this.apiUrl, formData);
  }
}
