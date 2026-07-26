import { Component, OnInit } from '@angular/core';
import { PolicyService } from '../services/policy.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  reports = [
    {
      title: 'Commission Report',
      description: 'View summaries and totals for reference-wise commissions.',
      route: 'commission'
    }
  ];

  startDate = '';
  endDate = '';
  selectedReferenceName = '';
  referenceNames: string[] = [];
  reportData: Array<{ referenceName: string; commission: string }> = [];
  totalCommission = '0.00';
  loading = false;
  errorMessage = '';

  constructor(private policyService: PolicyService) {}

  ngOnInit(): void {
    const today = new Date();
    const prior = new Date(today);
    prior.setDate(today.getDate() - 30);
    this.startDate = this.formatDateInput(prior);
    this.endDate = this.formatDateInput(today);
    this.loadReferenceNames();
  }

  loadReferenceNames(): void {
    this.policyService.getAllReferenceNames().subscribe({
      next: (response) => {
        if (response && Array.isArray(response)) {
          this.referenceNames = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.referenceNames = response.data;
        } else {
          this.referenceNames = [];
        }
      },
      error: (error) => {
        console.error('Error loading reference names:', error);
        this.referenceNames = [];
      }
    });
  }

  formatDateInput(value: Date): string {
    return value.toISOString().split('T')[0];
  }

  generateReport(): void {
    this.errorMessage = '';
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Please select both start and end dates.';
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    if (start > end) {
      this.errorMessage = 'Start date cannot be later than end date.';
      return;
    }

    this.loading = true;
    this.policyService.getReferenceCommissionReport(this.startDate, this.endDate, this.selectedReferenceName).subscribe({
      next: (response) => {
        const data = response?.data || [];
        this.reportData = Array.isArray(data) ? data : [];
        this.totalCommission = this.reportData
          .reduce((sum, item) => sum + Number(item.commission || 0), 0)
          .toFixed(2);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error generating commission report:', error);
        this.errorMessage = error?.error?.message || 'Unable to generate the report. Please try again.';
        this.loading = false;
      }
    });
  }
}
