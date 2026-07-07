import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PolicyService } from '../services/policy.service';

@Component({
  selector: 'app-policy-list',
  templateUrl: './policy-list.component.html',
  styleUrls: ['./policy-list.component.css']
})
export class PolicyListComponent implements OnInit {
  policies: any[] = [];
  loading = false;
  error: string | null = null;
  showSearchPanel = false;
  isSearchActive = false;
  page = 1;
  limit = 10;
  totalItems = 0;
  totalPages = 1;
  activeSearch = '';
  activeSearchCriteria: any = null;
  
  // Search form model
  searchForm = {
    customerName: '',
    policyNumber: '',
    registrationNumber: '',
    mobileNumber: ''
  };

  constructor(private policyService: PolicyService, private router: Router) {}

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies(): void {
    this.page = 1;
    this.activeSearch = '';
    this.activeSearchCriteria = null;
    this.fetchPolicies(1, '');
  }

  fetchPolicies(page: number, searchText: string): void {
    this.loading = true;
    this.error = null;

    const obs = this.activeSearchCriteria
      ? this.policyService.searchPolicies(this.activeSearchCriteria, page, this.limit)
      : this.policyService.getPolicies(page, this.limit, searchText);

    obs.subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.policies = response.data || [];
          this.totalItems = response.count ?? this.policies.length;
          this.page = response.page ?? page;
          this.limit = response.limit ?? this.limit;
          this.totalPages = response.totalPages ?? (this.limit ? Math.max(1, Math.ceil(this.totalItems / this.limit)) : 1);
          this.isSearchActive = this.activeSearch !== '';
          this.error = this.policies.length === 0 && this.activeSearch ? 'No policies found matching your search criteria.' : null;
        } else {
          this.error = response.message || 'Failed to load policies';
          this.policies = [];
          this.totalItems = 0;
          this.totalPages = 1;
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error loading policies. Please try again.';
        console.error('Error loading policies:', error);
      }
    });
  }

  toggleSearchPanel(): void {
    this.showSearchPanel = !this.showSearchPanel;
  }

  performSearch(): void {
    // Validate that at least one search field is filled
    if (!this.searchForm.customerName.trim() && 
        !this.searchForm.policyNumber.trim() && 
        !this.searchForm.registrationNumber.trim() && 
        !this.searchForm.mobileNumber.trim()) {
      this.error = 'Please enter at least one search criterion';
      return;
    }

    this.loading = true;
    this.error = null;

    const searchCriteria = {
      customerName: this.searchForm.customerName.trim() || null,
      policyNumber: this.searchForm.policyNumber.trim() || null,
      registrationNumber: this.searchForm.registrationNumber.trim() || null,
      mobileNumber: this.searchForm.mobileNumber.trim() || null
    };

    const searchText = Object.values(searchCriteria)
      .filter((value: unknown): value is string => typeof value === 'string')
      .map((value: string) => value.trim())
      .filter((value: string) => value.length > 0)
      .join(' ');

    this.activeSearch = searchText;
    this.activeSearchCriteria = searchCriteria;
    this.fetchPolicies(1, searchText);
  }

  resetSearch(): void {
    this.searchForm = {
      customerName: '',
      policyNumber: '',
      registrationNumber: '',
      mobileNumber: ''
    };
    this.isSearchActive = false;
    this.error = null;
    this.activeSearchCriteria = null;
    this.loadPolicies();
  }

  onPageClick(pageItem: number | string): void {
    if (pageItem === '...') {
      return;
    }
    this.changePage(pageItem as number);
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) {
      return;
    }
    this.fetchPolicies(newPage, this.activeSearch);
  }

  get paginationRange(): Array<number | string> {
    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    const pages: Array<number | string> = [];
    const left = Math.max(2, this.page - 1);
    const right = Math.min(this.totalPages - 1, this.page + 1);

    pages.push(1);

    if (left > 2) {
      pages.push('...');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < this.totalPages - 1) {
      pages.push('...');
    }

    pages.push(this.totalPages);
    return pages;
  }

  getSearchSummary(): string {
    const criteria = [];
    if (this.searchForm.customerName.trim()) criteria.push(`Customer: ${this.searchForm.customerName}`);
    if (this.searchForm.policyNumber.trim()) criteria.push(`Policy: ${this.searchForm.policyNumber}`);
    if (this.searchForm.registrationNumber.trim()) criteria.push(`Registration: ${this.searchForm.registrationNumber}`);
    if (this.searchForm.mobileNumber.trim()) criteria.push(`Mobile: ${this.searchForm.mobileNumber}`);
    return criteria.join(', ');
  }

  addNewPolicy(): void {
    this.router.navigate(['/policies/new']);
  }

  viewPolicy(policyId: number): void {
    this.router.navigate(['/policies', policyId]);
  }

  deletePolicy(policyId: number, policyNumber: string): void {
    if (confirm(`Are you sure you want to delete policy ${policyNumber}? This action cannot be undone.`)) {
      this.policyService.deletePolicy(policyId).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Policy deleted successfully!');
            this.loadPolicies();
          } else {
            alert(response.message || 'Failed to delete policy');
          }
        },
        error: (error) => {
          console.error('Error deleting policy:', error);
          alert(error.error?.message || error.message || 'Error deleting policy');
        }
      });
    }
  }

  getDocumentCount(policy: any): number {
    return policy.documents ? policy.documents.length : 0;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
