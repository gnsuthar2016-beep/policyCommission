import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Save Customer
  saveCustomer(data: { 
    name: string; 
    mobileNumber: string; 
    alternativeMobileNumber?: string;
    emailId: string;
    dateOfBirth?: string;
    remark?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customer`, data);
  }

  // Get all Customers
  getAllCustomers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customer`);
  }

  // Get customers with optional pagination and search
  getCustomers(page?: number, limit?: number, search?: string): Observable<any> {
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
    return this.http.get<any>(`${this.apiUrl}/customer`, { params });
  }

  // Get Customer by ID
  getCustomerById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customer/${id}`);
  }

  // Delete Customer by ID
  deleteCustomer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/customer/${id}`);
  }

  // Update Customer by ID
  updateCustomer(id: number, data: { 
    name: string; 
    mobileNumber: string; 
    alternativeMobileNumber?: string;
    emailId: string;
    dateOfBirth?: string;
    remark?: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/customer/${id}`, data);
  }

  // Add document to customer
  addDocumentToCustomer(customerId: number, documentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/customer/${customerId}/document`, documentData);
  }

  // Delete customer document
  deleteCustomerDocument(documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/customer/document/${documentId}`);
  }

  // Import customers via Excel file (form-data 'file')
  importCustomers(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.apiUrl}/import/customers`, fd);
  }
}
