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

  // Get all policies
  getAllPolicies(): Observable<any> {
    return this.http.get(`${this.apiUrl}/policies`);
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

  // Get renewal policies (expiring within 3 days)
  getRenewalPolicies(): Observable<any> {
    return this.http.get(`${this.apiUrl}/policies/renewal`);
  }
}
