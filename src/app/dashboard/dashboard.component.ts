import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PolicyService } from '../services/policy.service';
import {
  Chart,
  ChartConfiguration,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController
);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('dailyChart') dailyChartCanvas!: ElementRef;
  @ViewChild('monthlyChart') monthlyChartCanvas!: ElementRef;

  filterForm!: FormGroup;
  
  // Chart instances
  dailyChart: Chart | null = null;
  monthlyChart: Chart | null = null;

  // Data properties
  referenceNames: string[] = [];
  selectedReferenceName: string = '';
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth() + 1;
  
  loading = false;
  dailyChartData: any[] = [];
  monthlyChartData: any[] = [];
  renewalPolicies: any[] = [];
  renewalLoading = false;
  todayEntriesCount = 0;

  // Available months and years
  months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  years: number[] = [];

  constructor(
    private fb: FormBuilder,
    private policyService: PolicyService
  ) {
    // Initialize years (current year and previous 5 years)
    for (let i = 0; i < 5; i++) {
      this.years.push(this.currentYear - i);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadReferenceNames();
    // Show policies expiring within next 15 days
    this.loadRenewalPolicies(15);
    this.loadTodayEntriesCount();
    // Delay chart loading to ensure canvas elements are initialized
    setTimeout(() => {
      this.loadDailyCommissionChart();
      this.loadMonthlyCommissionChart();
    }, 100);
  }

  loadTodayEntriesCount(): void {
    this.policyService.getTodayPoliciesCount().subscribe({
      next: (response) => {
        if (response && response.success) {
          this.todayEntriesCount = Number(response.count) || 0;
        } else if (response && typeof response.count === 'number') {
          this.todayEntriesCount = response.count;
        } else {
          this.todayEntriesCount = 0;
        }
      },
      error: (error) => {
        console.error('Error loading today entries count:', error);
        this.todayEntriesCount = 0;
      }
    });
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      year: [this.currentYear],
      month: [this.currentMonth],
      referenceName: ['']
    });

    // Listen to filter changes - update both charts
    this.filterForm.valueChanges.subscribe(() => {
      this.loadDailyCommissionChart();
      this.loadMonthlyCommissionChart();
    });
  }

  loadReferenceNames(): void {
    this.policyService.getAllReferenceNames().subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.referenceNames = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading reference names:', error);
      }
    });
  }

  loadDailyCommissionChart(): void {
    this.loading = true;
    const year = this.filterForm.get('year')?.value;
    const month = this.filterForm.get('month')?.value;
    const referenceName = this.filterForm.get('referenceName')?.value || undefined;

    this.policyService.getDailyCommissionData(year, month, referenceName).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data && Array.isArray(response.data)) {
          this.dailyChartData = response.data;
          // Use setTimeout to ensure canvas is ready
          setTimeout(() => {
            this.renderDailyChart();
          }, 50);
        } else {
          this.dailyChartData = [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading daily commission data:', error);
        this.dailyChartData = [];
      }
    });
  }

  loadMonthlyCommissionChart(): void {
    const year = this.filterForm?.get('year')?.value;
    const referenceName = this.filterForm?.get('referenceName')?.value || undefined;

    this.policyService.getMonthlyCommissionData(year, referenceName).subscribe({
      next: (response) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          this.monthlyChartData = response.data;
          // Use setTimeout to ensure canvas is ready
          setTimeout(() => {
            this.renderMonthlyChart();
          }, 50);
        } else {
          this.monthlyChartData = [];
        }
      },
      error: (error) => {
        console.error('Error loading monthly commission data:', error);
        this.monthlyChartData = [];
      }
    });
  }

  renderDailyChart(): void {
    // Wait for canvas element to be available
    if (!this.dailyChartCanvas || !this.dailyChartCanvas.nativeElement) {
      console.warn('Daily chart canvas element not found');
      return;
    }

    // Prepare data for daily chart
    const days = this.dailyChartData.map(d => d.day);
    const commissions = this.dailyChartData.map(d => parseFloat(d.commission || 0));
    const collections = this.dailyChartData.map(d => parseFloat(d.collection || 0));

    const ctx = this.dailyChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Unable to get 2D context for daily chart');
      return;
    }

    // Destroy existing chart if it exists
    if (this.dailyChart) {
      this.dailyChart.destroy();
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Daily Commission',
            data: commissions,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6'
          },
          {
            label: 'Daily Collection',
            data: collections,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointBackgroundColor: '#10b981'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: `Daily Commission & Collection - ${this.getMonthName(this.filterForm.get('month')?.value)} ${this.filterForm.get('year')?.value}`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount (₹)'
            }
          }
        }
      }
    };

    this.dailyChart = new Chart(ctx, config);
  }

  renderMonthlyChart(): void {
    // Wait for canvas element to be available
    if (!this.monthlyChartCanvas || !this.monthlyChartCanvas.nativeElement) {
      console.warn('Monthly chart canvas element not found');
      return;
    }

    // Prepare data for monthly chart
    const months = this.monthlyChartData.map((d: any) => d.month);
    const commissions = this.monthlyChartData.map((d: any) => parseFloat(d.commission || 0));

    const ctx = this.monthlyChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('Unable to get 2D context for monthly chart');
      return;
    }

    // Destroy existing chart if it exists
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Monthly Commission',
            data: commissions,
            backgroundColor: '#3b82f6',
            borderColor: '#1e40af',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Monthly Commission Summary'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount (₹)'
            }
          }
        }
      }
    };

    this.monthlyChart = new Chart(ctx, config);
  }

  getMonthName(monthNumber: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[monthNumber - 1] || '';
  }

  onFilterChange(): void {
    this.loadDailyCommissionChart();
    this.loadMonthlyCommissionChart();
  }

  resetFilters(): void {
    this.filterForm.reset({
      year: this.currentYear,
      month: this.currentMonth,
      referenceName: ''
    });
    // Explicitly call load methods after reset
    this.loadDailyCommissionChart();
    this.loadMonthlyCommissionChart();
  }

  loadRenewalPolicies(days: number = 3): void {
    this.renewalLoading = true;
    this.policyService.getRenewalPolicies(days).subscribe({
      next: (response) => {
        this.renewalLoading = false;
        if (response.success && Array.isArray(response.data)) {
          this.renewalPolicies = response.data.map((policy: any) => ({
            ...policy,
            periodToFormatted: this.formatDateForDisplay(policy.periodTo)
          }));
        } else {
          this.renewalPolicies = [];
        }
      },
      error: (error) => {
        this.renewalLoading = false;
        console.error('Error loading renewal policies:', error);
        this.renewalPolicies = [];
      }
    });
  }

  formatDateForDisplay(dateValue: any): string {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  ngOnDestroy(): void {
    if (this.dailyChart) {
      this.dailyChart.destroy();
    }
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
  }
}
