import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../services/customer.service';

@Component({
  selector: 'app-customer-master',
  templateUrl: './customer-master.component.html',
  styleUrls: ['./customer-master.component.css']
})
export class CustomerMasterComponent implements OnInit {
  form!: FormGroup;
  customers: any[] = [];
  loading = false;
  isEditMode = false;
  editingCustomerId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchCustomers();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      alternativeMobileNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      emailId: ['', [ Validators.email]],
      dateOfBirth: ['', []],
      remark: ['', []]
    });
  }

  fetchCustomers(): void {
    this.loading = true;
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.customers = response.data;
        } else {
          this.customers = [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error fetching customers:', error);
        this.customers = [];
      }
    });
  }

  submit(): void {
    if (this.form.valid) {
      const formData = this.form.value;
      this.loading = true;

      const apiCall = this.isEditMode && this.editingCustomerId
        ? this.customerService.updateCustomer(this.editingCustomerId, formData)
        : this.customerService.saveCustomer(formData);

      apiCall.subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            const action = this.isEditMode ? 'updated' : 'added';
            alert(`Customer ${action} successfully!`);
            this.form.reset();
            this.isEditMode = false;
            this.editingCustomerId = null;
            this.fetchCustomers();
          } else {
            alert('Error: ' + response.message);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error saving customer:', error);
          alert('Error saving customer: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.form.markAllAsTouched();
      alert('Please fill all fields correctly.');
    }
  }

  editCustomer(customer: any): void {
    this.isEditMode = true;
    this.editingCustomerId = customer.id;
    this.form.patchValue({
      name: customer.name,
      mobileNumber: customer.mobileNumber,
      alternativeMobileNumber: customer.alternativeMobileNumber,
      emailId: customer.emailId,
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
      remark: customer.remark
    });
    window.scrollTo(0, 0);
  }

  deleteCustomer(id: number, name: string): void {
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
      this.loading = true;
      this.customerService.deleteCustomer(id).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            alert('Customer deleted successfully!');
            this.fetchCustomers();
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

  reset(): void {
    this.form.reset();
    this.isEditMode = false;
    this.editingCustomerId = null;
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    // if (control?.hasError('required')) {
    //   return `${this.getLabelName(field)} is required`;
    // }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${this.getLabelName(field)} must be at least ${minLength} characters`;
    }
    if (control?.hasError('pattern')) {
      if (field === 'mobileNumber') {
        return 'Mobile number must be 10 digits';
      }
      return `${this.getLabelName(field)} format is invalid`;
    }
    if (control?.hasError('email')) {
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
