import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PolicyService } from '../services/policy.service';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.css']
})
export class CustomerDashboardComponent implements OnInit {
  customerName = 'Customer';
  customerEmail = '';
  policies: any[] = [];
  documents: any[] = [];
  loading = true;
  errorMessage = '';
  summary = {
    policies: 0,
    documents: 0,
    expiringSoon: 0
  };

  constructor(
    private router: Router,
    private policyService: PolicyService
  ) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        this.customerName = parsed.name || parsed.email || 'Customer';
        this.customerEmail = parsed.email || parsed.emailId || '';
      } catch (error) {
        console.error('Error reading saved user', error);
      }
    }

    if (this.customerEmail) {
      this.loadDashboard();
    } else {
      this.loading = false;
      this.errorMessage = 'No customer email was found. Please sign in again.';
    }
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.policyService.getCustomerDashboard(this.customerEmail).subscribe({
      next: (response) => {
        const data = response?.data || {};
        const customer = data.customer || {};

        this.customerName = customer.name || this.customerName;
        this.customerEmail = customer.emailId || this.customerEmail;
        this.policies = data.policies || [];
        this.documents = data.documents || [];
        this.summary = {
          policies: this.policies.length,
          documents: this.documents.length,
          expiringSoon: this.policies.filter((policy) => this.isExpiringSoon(policy.periodTo)).length
        };
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Unable to load your policies and documents right now.';
      }
    });
  }

  isExpiringSoon(expiryDate: string | Date | null | undefined): boolean {
    if (!expiryDate) {
      return false;
    }

    const expiry = new Date(expiryDate);
    if (Number.isNaN(expiry.getTime())) {
      return false;
    }

    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }

  formatCurrency(value: number | string | null | undefined): string {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(value: string | Date | null | undefined): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    this.router.navigate(['']);
  }
}
