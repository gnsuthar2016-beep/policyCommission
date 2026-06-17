import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = 'https://policy-api.alluresofttech.com/api';

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
    return this.http.post<any>(this.apiUrl, data);
  }

  // Get all Customers
  getAllCustomers(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Get Customer by ID
  getCustomerById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Delete Customer by ID
  deleteCustomer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
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
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
}
