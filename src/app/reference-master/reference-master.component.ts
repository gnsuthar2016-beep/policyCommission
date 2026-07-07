import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReferenceService } from '../services/reference.service';

@Component({
  selector: 'app-reference-master',
  templateUrl: './reference-master.component.html',
  styleUrls: ['./reference-master.component.css']
})
export class ReferenceMasterComponent implements OnInit {
  references: any[] = [];
  loading = false;
  searchQuery = '';
  page = 1;
  limit = 10;
  totalItems = 0;
  totalPages = 1;

  constructor(
    private referenceService: ReferenceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchReferences();
  }

  addReference(): void {
    this.router.navigate(['/reference-master/add']);
  }

  editReference(reference: any): void {
    this.router.navigate(['/reference-master/edit', reference.id]);
  }

  fetchReferences(reset = false): void {
    if (reset) {
      this.page = 1;
    }
    this.loading = true;
    this.referenceService.getReferences(this.page, this.limit, this.searchQuery.trim()).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.references = response.data || [];
          this.totalItems = response.count ?? (response.data?.length ?? 0);
          this.page = response.page ?? this.page;
          this.limit = response.limit ?? this.limit;
          this.totalPages = this.limit ? Math.max(1, Math.ceil(this.totalItems / this.limit)) : 1;
        } else {
          this.references = [];
          this.totalItems = 0;
          this.totalPages = 1;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error fetching references:', error);
        this.references = [];
        this.totalItems = 0;
        this.totalPages = 1;
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.fetchReferences(true);
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) {
      return;
    }
    this.page = newPage;
    this.fetchReferences();
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

  deleteReference(id: number, name: string): void {
    if (confirm(`Are you sure you want to delete reference "${name}"?`)) {
      this.loading = true;
      this.referenceService.deleteReference(id).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            alert('Reference deleted successfully!');
            this.fetchReferences(true);
          } else {
            alert('Error: ' + response.message);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error deleting reference:', error);
          alert('Error deleting reference: ' + (error.error?.message || error.message));
        }
      });
    }
  }
}
