import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'shree-ram-associate';
  showHeader = false;

  constructor(private router: Router, private authService: AuthService) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateHeaderVisibility();
      }
    });
  }

  ngOnInit(): void {
    this.updateHeaderVisibility();
    this.authService.sessionExpired$.subscribe(() => this.router.navigate(['/']));

    if (this.authService.isTokenValid()) {
      this.authService.restoreSession().subscribe((restored) => {
        if (restored && (this.router.url === '/' || this.router.url === '')) {
          const user = this.authService.getLoggedInUser();
          this.router.navigate([user?.userType === 'customer' ? '/customer-dashboard' : '/dashboard']);
        }
      });
    }
  }

  updateHeaderVisibility(): void {
    const currentUrl = this.router.url || '';
    const loginPage = currentUrl === '/' || currentUrl === '/login';
    const registerPage = currentUrl.includes('register');
    const forgotPasswordPage = currentUrl.includes('forgot-password');
    const changePasswordPage = currentUrl.includes('change-password');
    const otpLoginPage = currentUrl.includes('otp-login');
    const customerDashboardPage = currentUrl.includes('customer-dashboard');

    // Show header on OTP login and all normal app pages, but hide it on the basic auth pages and customer dashboard.
    this.showHeader = !(loginPage || registerPage || forgotPasswordPage || changePasswordPage || customerDashboardPage) || customerDashboardPage;
  }
}
