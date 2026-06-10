import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LogoutResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) { }

  logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.apiUrl}/logout`, {});
  }

  isUserLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  getLoggedInUser(): any {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  clearSession(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
  }
}
