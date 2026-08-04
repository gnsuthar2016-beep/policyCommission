import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  private apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://policy-api.alluresofttech.com/api';

  constructor(private http: HttpClient) { }

  savePolicy(policyData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policy`, policyData);
  }

  updatePolicy(policyId: number, policyData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/policy/${policyId}`, policyData);
  }

  getPolicyById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/policy/${id}`);
  }

  getAllPolicies(): Observable<any> {
    return this.getPolicies(1, 10);
  }

  downloadPoliciesExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/policies/export`, { responseType: 'blob' });
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

  getPoliciesByMonth(year: number, month: number, referenceName?: string): Observable<any> {
    let url = `${this.apiUrl}/policies/month/${year}/${month}`;
    if (referenceName) {
      url += `?referenceName=${encodeURIComponent(referenceName)}`;
    }
    return this.http.get(url);
  }

  getAllReferenceNames(): Observable<any> {
    return this.http.get(`${this.apiUrl}/policies/references/unique`);
  }

  getDailyCommissionData(year: number, month: number, referenceName?: string): Observable<any> {
    let url = `${this.apiUrl}/policies/commission/daily/${year}/${month}`;
    if (referenceName) {
      url += `?referenceName=${encodeURIComponent(referenceName)}`;
    }
    return this.http.get(url);
  }

  getMonthlyCommissionData(year: number, referenceName?: string): Observable<any> {
    let url = `${this.apiUrl}/policies/commission/monthly/${year}`;
    if (referenceName) {
      url += `?referenceName=${encodeURIComponent(referenceName)}`;
    }
    return this.http.get(url);
  }

  getReferenceCommissionReport(startDate: string, endDate: string, referenceName?: string): Observable<any> {
    const params: any = { startDate, endDate };
    if (referenceName) {
      params.referenceName = referenceName;
    }
    return this.http.get<any>(`${this.apiUrl}/policies/commission/reference-summary`, { params });
  }

  downloadCommissionReportExcel(startDate: string, endDate: string, referenceName?: string): Observable<Blob> {
    const params: any = { startDate, endDate };
    if (referenceName) {
      params.referenceName = referenceName;
    }
    return this.http.get(`${this.apiUrl}/policies/commission/reference-summary/export`, {
      params,
      responseType: 'blob'
    });
  }

  addDocumentToPolicy(policyId: number, documentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/policy/${policyId}/document`, documentData);
  }

  deleteDocument(documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/document/${documentId}`);
  }

  importPolicies(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.apiUrl}/import/policies`, fd);
  }

  getRenewalPolicies(days?: number): Observable<any> {
    const params: any = {};
    if (days != null) params.days = days;
    return this.http.get(`${this.apiUrl}/policies/renewal`, { params });
  }

  getTodayPoliciesCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/policies/today/count`);
  }

  getCustomerDashboard(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/customer/dashboard`, {
      params: { email }
    });
  }
  // Search policies by structured criteria; supports pagination and exact match
  searchPolicies(searchCriteria: any = {}, page: number = 1, limit: number = 10, exact: boolean = false): Observable<any> {
    const payload = { ...searchCriteria, page, limit };
    const params: any = {};
    if (exact) {
      params.exact = true;
    }
    return this.http.post<any>(`${this.apiUrl}/policies/search`, payload, { params });
  }

  deletePolicy(policyId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/policy/${policyId}`);
  }
}
