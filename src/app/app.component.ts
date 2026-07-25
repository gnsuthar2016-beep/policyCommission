import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'shree-ram-associate';
  showHeader = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateHeaderVisibility();
      }
    });
  }

  ngOnInit(): void {
    this.updateHeaderVisibility();
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
