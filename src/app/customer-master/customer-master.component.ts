import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer-master',
  templateUrl: './customer-master.component.html',
  styleUrls: ['./customer-master.component.css']
})
export class CustomerMasterComponent implements OnInit {
  customers: any[] = [];
  loading = false;
  searchQuery = '';
  page = 1;
  limit = 10;
  totalItems = 0;
  totalPages = 1;

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchCustomers();
  }

  addCustomer(): void {
    this.router.navigate(['/customer-master/add']);
  }

  editCustomer(customer: any): void {
    this.router.navigate(['/customer-master/edit', customer.id]);
  }

  fetchCustomers(reset = false): void {
    if (reset) {
      this.page = 1;
    }
    this.loading = true;
    this.customerService.getCustomers(this.page, this.limit, this.searchQuery.trim()).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.customers = response.data || [];
          this.totalItems = response.count ?? (response.data?.length ?? 0);
          this.page = response.page ?? this.page;
          this.limit = response.limit ?? this.limit;
          this.totalPages = this.limit ? Math.max(1, Math.ceil(this.totalItems / this.limit)) : 1;
        } else {
          this.customers = [];
          this.totalItems = 0;
          this.totalPages = 1;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error fetching customers:', error);
        this.customers = [];
        this.totalItems = 0;
        this.totalPages = 1;
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.fetchCustomers(true);
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) {
      return;
    }
    this.page = newPage;
    this.fetchCustomers();
  }

  onPageClick(pageItem: number | string): void {
    if (pageItem === '...') {
      return;
    }
    this.changePage(pageItem as number);
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

  deleteCustomer(id: number, name: string): void {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) {
      return;
    }
    this.loading = true;
    this.customerService.deleteCustomer(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          alert('Customer deleted successfully!');
          this.fetchCustomers(true);
        } else {
          alert('Error: ' + response.message);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error deleting customer:', error);
        alert('Error deleting customer: ' + (error.error?.message || error.message));
      }
    });
  }
}
