import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { interval, Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface User {
  id: number;
  email: string;
  name: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  user: User | null = null;
  showUserMenu = false;
  showMobileMenu = false;
  sessionStartTime: string = '';
  sessionDuration: string = '0s';
  private refreshSubscription: Subscription | null = null;
  private closeMenuTimeout: any;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserDetails();
    this.setSessionStartTime();
    // Refresh session duration every second
    this.refreshSubscription = interval(1000).subscribe(() => {
      this.updateSessionDuration();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.closeMenuTimeout) {
      clearTimeout(this.closeMenuTimeout);
    }
  }

  loadUserDetails(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
    }
  }

  setSessionStartTime(): void {
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
      this.sessionStartTime = new Date(loginTime).toLocaleString();
      this.updateSessionDuration();
    } else {
      // If loginTime not found, set it now
      const now = new Date().toISOString();
      localStorage.setItem('loginTime', now);
      this.sessionStartTime = new Date(now).toLocaleString();
      this.sessionDuration = '0s';
    }
  }

  updateSessionDuration(): void {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) {
      this.sessionDuration = '0s';
      return;
    }

    const start = new Date(loginTime).getTime();
    const now = new Date().getTime();
    const diffMs = now - start;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      this.sessionDuration = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      this.sessionDuration = `${minutes}m ${seconds}s`;
    } else {
      this.sessionDuration = `${seconds}s`;
    }
  }

  onMouseEnter(): void {
    // Clear any pending timeout to close the menu
    if (this.closeMenuTimeout) {
      clearTimeout(this.closeMenuTimeout);
    }
    this.showUserMenu = true;
  }

  onMouseLeave(): void {
    // Add a small delay before closing the menu (300ms)
    // This allows user to move mouse from button to menu without it closing
    this.closeMenuTimeout = setTimeout(() => {
      this.showUserMenu = false;
    }, 300);
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  logout(): void {
    // Clear user session
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    
    // Call logout API
    this.userService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        // Even if API fails, redirect to login
        this.router.navigate(['/']);
      }
    });
  }
}
