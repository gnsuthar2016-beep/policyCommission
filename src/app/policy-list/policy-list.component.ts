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

  addNewPolicy(): void {
    this.router.navigate(['/policies/new']);
  }

  viewPolicy(policyId: number): void {
    this.router.navigate(['/policies', policyId]);
  }

  getDocumentCount(policy: any): number {
    return policy.documents ? policy.documents.length : 0;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
