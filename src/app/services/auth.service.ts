import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OtpSendRequest {
  email: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    email: string;
    name: string;
    token: string;
    userType?: string;
  };
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data?: { token: string };
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://policy-api.alluresofttech.com/api';

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly sessionExpiredSubject = new Subject<void>();
  readonly sessionExpired$ = this.sessionExpiredSubject.asObservable();

  constructor(private http: HttpClient) {
    this.startSessionRefresh();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  sendOtp(payload: OtpSendRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/otp/send`, payload);
  }

  verifyOtp(payload: OtpVerifyRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/otp/verify`, payload);
  }

  refreshToken(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${this.apiUrl}/auth/refresh`, {
      token: this.getToken()
    });
  }

  restoreSession(): Observable<boolean> {
    if (!this.isTokenValid()) {
      this.clearSession();
      return of(false);
    }

    return this.refreshToken().pipe(
      tap((response) => {
        const user = this.getLoggedInUser();
        if (response.success && response.data?.token && user) {
          this.saveSession({ ...user, token: response.data.token });
        }
      }),
      map((response) => !!response.success && !!response.data?.token),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.apiUrl}/logout`, {});
  }

  saveSession(data: LoginResponse['data']): void {
    if (!data?.token) {
      return;
    }
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('loginTime', new Date().toISOString());
    this.startSessionRefresh();
  }

  getToken(): string | null {
    const user = this.getLoggedInUser();
    return user?.token || null;
  }

  getLoggedInUser(): LoginResponse['data'] | null {
    const userData = localStorage.getItem('user');
    if (!userData) {
      return null;
    }

    try {
      return JSON.parse(userData);
    } catch {
      this.clearSession();
      return null;
    }
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    const payload = this.getTokenPayload(token);
    return !!payload?.exp && payload.exp * 1000 > Date.now();
  }

  startSessionRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (!this.isTokenValid()) {
      return;
    }

    const payload = this.getTokenPayload(this.getToken());
    if (!payload?.exp) {
      return;
    }
    const refreshIn = Math.max(1000, (payload.exp * 1000) - Date.now() - 5 * 60 * 1000);
    this.refreshTimer = setTimeout(() => {
      this.refreshToken().subscribe({
        next: (response) => {
          const user = this.getLoggedInUser();
          if (response.success && response.data?.token && user) {
            this.saveSession({ ...user, token: response.data.token });
          } else {
            this.expireSession();
          }
        },
        error: () => this.expireSession()
      });
    }, refreshIn);
  }

  clearSession(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
  }

  private expireSession(): void {
    this.clearSession();
    this.sessionExpiredSubject.next();
  }

  private getTokenPayload(token: string | null): { exp?: number } | null {
    if (!token) {
      return null;
    }
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
