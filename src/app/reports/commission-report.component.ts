import { Component, OnInit } from '@angular/core';
import { PolicyService } from '../services/policy.service';

@Component({
  selector: 'app-commission-report',
  templateUrl: './commission-report.component.html',
  styleUrls: ['./commission-report.component.css']
})
export class CommissionReportComponent implements OnInit {
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
    this.startDate = this.formatDate(prior);
    this.endDate = this.formatDate(today);
    this.loadReferenceNames();
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadReferenceNames(): void {
    this.policyService.getAllReferenceNames().subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.referenceNames = response;
        } else if (response && Array.isArray((response as any).data)) {
          this.referenceNames = (response as any).data;
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

  generateReport(): void {
    this.errorMessage = '';
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Please select both From and To dates.';
      return;
    }

    const from = new Date(this.startDate);
    const to = new Date(this.endDate);
    if (from > to) {
      this.errorMessage = 'From date cannot be after To date.';
      return;
    }

    this.loading = true;
    this.reportData = [];
    this.totalCommission = '0.00';

    this.policyService.getReferenceCommissionReport(this.startDate, this.endDate, this.selectedReferenceName).subscribe({
      next: (response) => {
        const data = response?.data || [];
        this.reportData = Array.isArray(data) ? data : [];
        const total = this.reportData.reduce((sum, item) => sum + Number(item.commission || 0), 0);
        this.totalCommission = total.toFixed(2);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error generating commission report:', error);
        this.errorMessage = error?.error?.message || 'Unable to generate report. Please try again.';
        this.loading = false;
      }
    });
  }
}
