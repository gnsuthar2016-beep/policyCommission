import { Component, OnInit } from '@angular/core';
import { jsPDF } from 'jspdf';
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

  getExportFileName(): string {
    const from = this.startDate || 'from-date';
    const to = this.endDate || 'to-date';
    return `commission-report-${from}-to-${to}.pdf`;
  }

  formatCommissionValue(value: string | number | null | undefined): string {
    const parsedValue = Number(value ?? 0);
    return Number.isFinite(parsedValue) ? parsedValue.toFixed(2) : '0.00';
  }

  exportReportToPdf(): void {
    if (this.reportData.length === 0) {
      this.errorMessage = 'No report data available to export.';
      return;
    }

    const doc = new jsPDF();
    const margin = 14;
    const rightColX = 150;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Commission Report', margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`From: ${this.startDate || 'N/A'}   To: ${this.endDate || 'N/A'}`, margin, y);
    y += 6;
    doc.text(`Reference: ${this.selectedReferenceName || 'All References'}`, margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Commission: Rs. ${this.formatCommissionValue(this.totalCommission)}`, margin, y);
    y += 10;

    doc.setDrawColor(200);
    doc.line(margin, y, 196, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Reference Name', margin, y);
    doc.text('Commission Amount (Rs.)', rightColX, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    this.reportData.forEach((row) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      const referenceText = row.referenceName || 'N/A';
      const commissionText = this.formatCommissionValue(row.commission);
      const wrappedReference = doc.splitTextToSize(referenceText, 120);
      doc.text(wrappedReference, margin, y);
      doc.text(`Rs. ${commissionText}`, rightColX, y);
      y += wrappedReference.length * 4 + 2;
    });

    doc.save(this.getExportFileName());
    this.errorMessage = '';
  }
}
