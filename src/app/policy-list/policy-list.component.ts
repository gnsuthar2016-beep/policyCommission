import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PolicyService } from '../services/policy.service';
import { formatDateToISO, formatDateToDisplay } from '../utils/date-utils';

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
    this.loading = true;
    this.error = null;
    
    this.policyService.getAllPolicies().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.policies = response.data || [];
          this.isSearchActive = false;
        } else {
          this.error = response.message || 'Failed to load policies';
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

    this.policyService.searchPolicies(searchCriteria).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.policies = response.data || [];
          this.isSearchActive = true;
          if (this.policies.length === 0) {
            this.error = 'No policies found matching your search criteria.';
          }
        } else {
          this.error = response.message || 'Failed to search policies';
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Error searching policies. Please try again.';
        console.error('Error searching policies:', error);
      }
    });
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
    this.loadPolicies();
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
    return formatDateToDisplay(date, 'N/A');
  }
}
