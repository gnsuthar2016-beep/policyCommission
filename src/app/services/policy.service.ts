import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  private apiUrl = 'https://policy-api.alluresofttech.com/api';

  constructor(private http: HttpClient) { }

  // Save policy details
  savePolicy(policyData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policy`, policyData);
  }

  // Update policy details
  updatePolicy(policyId: number, policyData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/policy/${policyId}`, policyData);
  }

  // Get policy by ID with documents
  getPolicyById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/policy/${id}`);
  }

  // Get all policies with optional search and pagination
  getAllPolicies(): Observable<any> {
    return this.getPolicies(1, 10);
  }

  getPolicies(page?: number, limit?: number, search?: string): Observable<any> {
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
    return this.http.get<any>(`${this.apiUrl}/policies`, { params });
  }

  // Get policies by month and optional reference name
  getPoliciesByMonth(year: number, month: number, referenceName?: string): Observable<any> {
    let url = `${this.apiUrl}/policies/month/${year}/${month}`;
    if (referenceName) {
      url += `?referenceName=${encodeURIComponent(referenceName)}`;
    }
    return this.http.get(url);
  }

  // Get all unique reference names (brokers)
  getAllReferenceNames(): Observable<any> {
    return this.http.get(`${this.apiUrl}/policies/references/unique`);
  }

  // Get daily commission data for a month
  getDailyCommissionData(year: number, month: number, referenceName?: string): Observable<any> {
    let url = `${this.apiUrl}/policies/commission/daily/${year}/${month}`;
    if (referenceName) {
      url += `?referenceName=${encodeURIComponent(referenceName)}`;
    }
    return this.http.get(url);
  }

  // Get monthly commission data
  getMonthlyCommissionData(year: number, referenceName?: string): Observable<any> {
    let url = `${this.apiUrl}/policies/commission/monthly/${year}`;
    if (referenceName) {
      url += `?referenceName=${encodeURIComponent(referenceName)}`;
    }
    return this.http.get(url);
  }

  // Add document to policy
  addDocumentToPolicy(policyId: number, documentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policy/${policyId}/document`, documentData);
  }

  // Delete document
  deleteDocument(documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/document/${documentId}`);
  }

  // Import policies via Excel file (form-data 'file')
  importPolicies(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.apiUrl}/import/policies`, fd);
  }

  // Get renewal policies (expiring within `days`). Default server-side is 3 days.
  getRenewalPolicies(days?: number): Observable<any> {
    const params: any = {};
    if (days != null) params.days = days;
    return this.http.get(`${this.apiUrl}/policies/renewal`, { params });
  }

  // Get count of policies created today
  getTodayPoliciesCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/policies/today/count`);
  }

  // Search policies by structured criteria; supports pagination
  searchPolicies(searchCriteria: any = {}, page: number = 1, limit: number = 10): Observable<any> {
    const payload = { ...searchCriteria, page, limit };
    return this.http.post<any>(`${this.apiUrl}/policies/search`, payload);
  }

  deletePolicy(policyId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/policy/${policyId}`);
  }
}
