import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PolicyService } from '../services/policy.service';
import { CustomerService } from '../services/customer.service';
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
  @ViewChild('birthdayCanvas') birthdayCanvas!: ElementRef;

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
  birthdaysToday: any[] = [];
  birthdayTemplates: any[] = [];
  selectedBirthdayCustomer: any = null;
  selectedTemplateId: number | null = null;
  selectedTemplate: any = null;
  customBirthdayText = '';
  showBirthdayCardPanel = false;
  birthdayTemplateUploadFile: File | null = null;
  birthdayTemplateTitle = '';
  birthdayTemplateUploadError = '';
  birthdayTemplateUploadSuccess = '';
  sharingBirthdayCard = false;
  defaultBirthdayTemplate = {
    id: 0,
    title: 'Default Birthday Image',
    filePath: '/assets/birthday-templates/birthday-template-default.jpg'
  };

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
    , private customerService: CustomerService
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
    this.loadBirthdaysToday();
    this.loadBirthdayTemplates();
    // Delay chart loading to ensure canvas elements are initialized
    setTimeout(() => {
      this.loadDailyCommissionChart();
      this.loadMonthlyCommissionChart();
    }, 100);
  }

  loadBirthdaysToday(): void {
    this.customerService.getTodaysBirthdays().subscribe({
      next: (resp) => {
        if (resp && resp.success && Array.isArray(resp.data)) {
          this.birthdaysToday = resp.data;
        } else if (Array.isArray(resp)) {
          this.birthdaysToday = resp;
        } else if (resp && Array.isArray(resp.data)) {
          this.birthdaysToday = resp.data;
        } else {
          this.birthdaysToday = [];
        }
      },
      error: (err) => {
        console.error('Error loading birthdays today:', err);
        this.birthdaysToday = [];
      }
    });
  }

  loadBirthdayTemplates(): void {
    this.customerService.getBirthdayTemplates().subscribe({
      next: (response) => {
        const defaultTemplate = this.defaultBirthdayTemplate;
        if (response && response.success && Array.isArray(response.data)) {
          this.birthdayTemplates = [defaultTemplate, ...response.data];
          if (!this.selectedTemplate && this.birthdayTemplates.length) {
            this.selectBirthdayTemplate(this.birthdayTemplates[0]);
          }
        } else {
          this.birthdayTemplates = [defaultTemplate];
          if (!this.selectedTemplate) {
            this.selectBirthdayTemplate(defaultTemplate);
          }
        }
      },
      error: (error) => {
        console.error('Error loading birthday templates:', error);
        this.birthdayTemplates = [this.defaultBirthdayTemplate];
        if (!this.selectedTemplate) {
          this.selectBirthdayTemplate(this.defaultBirthdayTemplate);
        }
      }
    });
  }

  openBirthdayWishPanel(customer: any): void {
    this.selectedBirthdayCustomer = customer;
    this.showBirthdayCardPanel = true;
    if (!this.selectedTemplate && this.birthdayTemplates.length) {
      this.selectBirthdayTemplate(this.birthdayTemplates[0]);
    }
    setTimeout(() => {
      this.renderBirthdayCanvas();
    }, 100);
  }

  closeBirthdayWishPanel(): void {
    this.showBirthdayCardPanel = false;
    this.selectedBirthdayCustomer = null;
    this.customBirthdayText = '';
    this.birthdayTemplateUploadError = '';
    this.birthdayTemplateUploadSuccess = '';
  }

  selectBirthdayTemplate(template: any): void {
    this.selectedTemplateId = template.id;
    this.selectedTemplate = template;
    setTimeout(() => {
      this.renderBirthdayCanvas();
    }, 100);
  }

  onBirthdayTemplateFileSelected(event: any): void {
    const file = event.target.files?.[0];
    this.birthdayTemplateUploadFile = file || null;
  }

  uploadBirthdayTemplate(): void {
    if (!this.birthdayTemplateUploadFile) {
      this.birthdayTemplateUploadError = 'Please select an image to upload.';
      return;
    }
    this.birthdayTemplateUploadError = '';
    this.birthdayTemplateUploadSuccess = '';
    this.customerService.uploadBirthdayTemplate(this.birthdayTemplateUploadFile, this.birthdayTemplateTitle).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.birthdayTemplateUploadSuccess = 'Template uploaded successfully.';
          this.birthdayTemplateUploadFile = null;
          this.birthdayTemplateTitle = '';
          this.loadBirthdayTemplates();
        } else {
          this.birthdayTemplateUploadError = response.message || 'Upload failed';
        }
      },
      error: (error) => {
        console.error('Error uploading birthday template:', error);
        this.birthdayTemplateUploadError = error?.message || 'Upload failed';
      }
    });
  }

  renderBirthdayCanvas(): void {
    if (!this.selectedTemplate || !this.birthdayCanvas || !this.birthdayCanvas.nativeElement) {
      return;
    }

    const canvas: HTMLCanvasElement = this.birthdayCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const maxWidth = 600;
      const maxHeight = 800;
      let width = image.naturalWidth;
      let height = image.naturalHeight;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = width * ratio;
      height = height * ratio;

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);

      if (this.customBirthdayText && this.customBirthdayText.trim()) {
        const text = this.customBirthdayText.trim();
        const padding = 24;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const maxTextWidth = width - padding * 2;
        const wrappedLines = [];
        const words = text.split(' ');
        let line = '';

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTextWidth && line) {
            wrappedLines.push(line.trim());
            line = `${words[i]} `;
          } else {
            line = testLine;
          }
        }
        if (line.trim()) {
          wrappedLines.push(line.trim());
        }

        const lineHeight = 36;
        const blockHeight = wrappedLines.length * lineHeight + padding;
        const blockTop = height - blockHeight;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, blockTop, width, blockHeight);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 4;
        let textY = blockTop + padding / 2 + lineHeight / 2;
        wrappedLines.forEach((lineText) => {
          ctx.strokeText(lineText, width / 2, textY);
          ctx.fillText(lineText, width / 2, textY);
          textY += lineHeight;
        });
      }
    };

    image.onerror = () => {
      console.error('Unable to load birthday template image for preview');
    };

    image.src = this.selectedTemplate.filePath;
  }

  sendBirthdayWish(): void {
    if (!this.selectedTemplate || !this.selectedBirthdayCustomer || !this.birthdayCanvas || !this.birthdayCanvas.nativeElement) {
      return;
    }

    const phone = this.getWhatsappPhone(this.selectedBirthdayCustomer);
    if (!phone) {
      alert('Customer mobile number is not available for WhatsApp.');
      return;
    }

    const canvas: HTMLCanvasElement = this.birthdayCanvas.nativeElement;
    const imageData = canvas.toDataURL('image/png');
    const message = `Happy Birthday ${this.selectedBirthdayCustomer.name}! 🎉\n\nPlease paste the birthday card image below.`;
    this.sharingBirthdayCard = true;

    const openWhatsApp = () => {
      this.sharingBirthdayCard = false;
      window.open(this.getWhatsAppUrl(phone, message), '_blank');
    };

    if (navigator.clipboard && navigator.clipboard.write) {
      const blob = this.dataURLToBlob(imageData);
      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([clipboardItem])
        .then(() => {
          openWhatsApp();
          alert('Birthday image copied to clipboard. Paste it into the WhatsApp chat.');
        })
        .catch((err) => {
          console.warn('Clipboard write failed:', err);
          openWhatsApp();
        });
    } else {
      openWhatsApp();
    }
  }

  dataURLToBlob(dataURL: string): Blob {
    const parts = dataURL.split(',');
    const contentType = parts[0].split(':')[1].split(';')[0];
    const byteString = atob(parts[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], { type: contentType });
  }

  getWhatsappPhone(customer: any): string | null {
    if (!customer) return null;
    const raw = customer.mobileNumber || customer.alternativeMobileNumber;
    if (!raw) return null;
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.length === 10) {
      return `91${digits}`;
    }
    return digits;
  }

  getWhatsAppUrl(phone: string, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
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
