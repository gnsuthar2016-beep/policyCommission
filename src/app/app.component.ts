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
    const loginPage = this.router.url === '/' || this.router.url === '/login';
    const registerPage = this.router.url.includes('register');
    const forgotPasswordPage = this.router.url.includes('forgot-password');
    const changePasswordPage = this.router.url.includes('change-password');
    
    // Show header on all pages except login/register/forgot-password/change-password
    this.showHeader = !(loginPage || registerPage || forgotPasswordPage || changePasswordPage);
  }
}
