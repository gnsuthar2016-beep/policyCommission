import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEditMode = false;
  customerId: number | null = null;
  customerImportErrors: string[] = [];
  customerImportLoading = false;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.customerId = Number(id);
        this.loadCustomer(this.customerId);
      } else {
        this.isEditMode = false;
        this.customerId = null;
      }
    });
  }

  buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      alternativeMobileNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      emailId: ['', [Validators.email]],
      dateOfBirth: ['', []],
      remark: ['', []]
    });
  }

  loadCustomer(id: number): void {
    this.loading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          const customer = response.data;
          this.form.patchValue({
            name: customer.name || '',
            mobileNumber: customer.mobileNumber || '',
            alternativeMobileNumber: customer.alternativeMobileNumber || '',
            emailId: customer.emailId || '',
            dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
            remark: customer.remark || ''
          });
        } else {
          alert(response.message || 'Customer not found.');
          this.router.navigate(['/customer-master']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading customer:', error);
        alert('Unable to load customer.');
        this.router.navigate(['/customer-master']);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Please fix validation errors before continuing.');
      return;
    }

    this.loading = true;
    const payload = this.form.value;

    const request$ = this.isEditMode && this.customerId
      ? this.customerService.updateCustomer(this.customerId, payload)
      : this.customerService.saveCustomer(payload);

    request$.subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          const message = this.isEditMode ? 'Customer updated successfully.' : 'Customer saved successfully.';
          alert(message);
          this.router.navigate(['/customer-master']);
        } else {
          alert(response.message || 'Unable to save customer.');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error saving customer:', error);
        alert(error.error?.message || error.message || 'Unable to save customer.');
      }
    });
  }

  importCustomers(files: FileList | null): void {
    this.customerImportErrors = [];
    if (!files || files.length === 0) {
      alert('Please select an Excel file to import.');
      return;
    }
    const file = files[0];
    this.customerImportLoading = true;
    this.customerService.importCustomers(file).subscribe({
      next: (response) => {
        this.customerImportLoading = false;
        if (response.success) {
          const results = response.results || [];
          const failedRows = results.filter((row: any) => !row.success);
          const successfulRows = results.filter((row: any) => row.success);
          if (failedRows.length === 0) {
            alert('Customers imported successfully!');
          } else {
            const allErrors: string[] = [];
            for (const row of failedRows.slice(0, 10)) {
              if (Array.isArray(row.errors)) {
                for (const error of row.errors) {
                  allErrors.push(`Row ${row.row}: ${error}`);
                }
              } else if (row.errors) {
                allErrors.push(`Row ${row.row}: ${row.errors}`);
              } else {
                allErrors.push(`Row ${row.row}: Unknown error`);
              }
            }
            this.customerImportErrors = allErrors;
            if (failedRows.length > 10) {
              this.customerImportErrors.push(`... and ${failedRows.length - 10} more rows with errors`);
            }
            if (successfulRows.length > 0) {
              alert(`Imported ${successfulRows.length} rows successfully, ${failedRows.length} rows failed.`);
            }
          }
        } else {
          this.customerImportErrors = [response.message || 'Import failed.'];
        }
      },
      error: (error) => {
        this.customerImportLoading = false;
        console.error('Error importing customers:', error);
        this.customerImportErrors = [error.error?.message || error.message || 'Error importing customers.'];
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/customer-master']);
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control) {
      return '';
    }
    if (control.hasError('required')) {
      return `${this.getLabelName(field)} is required`;
    }
    if (control.hasError('minlength')) {
      const min = control.getError('minlength').requiredLength;
      return `${this.getLabelName(field)} must be at least ${min} characters`;
    }
    if (control.hasError('pattern')) {
      if (field === 'mobileNumber' || field === 'alternativeMobileNumber') {
        return 'Mobile number must be 10 digits';
      }
      return `${this.getLabelName(field)} format is invalid`;
    }
    if (control.hasError('email')) {
      return 'Email ID format is invalid';
    }
    return '';
  }

  getLabelName(field: string): string {
    const labels: { [key: string]: string } = {
      name: 'Name',
      mobileNumber: 'Mobile Number',
      alternativeMobileNumber: 'Alternative Mobile Number',
      emailId: 'Email ID',
      dateOfBirth: 'Date of Birth',
      remark: 'Remark'
    };
    return labels[field] || field;
  }
}
