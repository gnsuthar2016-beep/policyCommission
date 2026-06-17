import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReferenceService } from '../services/reference.service';

@Component({
  selector: 'app-reference-master',
  templateUrl: './reference-master.component.html',
  styleUrls: ['./reference-master.component.css']
})
export class ReferenceMasterComponent implements OnInit {
  form!: FormGroup;
  references: any[] = [];
  loading = false;
  isEditMode = false;
  editingReferenceId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private referenceService: ReferenceService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchReferences();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      alternativeMobileNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      emailId: ['', [Validators.email]],
      dateOfBirth: ['', []],
      remark: ['', []]
    });
  }

  fetchReferences(): void {
    this.loading = true;
    this.referenceService.getAllReferences().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.references = response.data;
        } else {
          this.references = [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error fetching references:', error);
        this.references = [];
      }
    });
  }

  submit(): void {
    if (this.form.valid) {
      const formData = this.form.value;
      this.loading = true;

      const apiCall = this.isEditMode && this.editingReferenceId
        ? this.referenceService.updateReference(this.editingReferenceId, formData)
        : this.referenceService.saveReference(formData);

      apiCall.subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            const action = this.isEditMode ? 'updated' : 'added';
            alert(`Reference ${action} successfully!`);
            this.form.reset();
            this.isEditMode = false;
            this.editingReferenceId = null;
            this.fetchReferences();
          } else {
            alert('Error: ' + response.message);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error saving reference:', error);
          alert('Error saving reference: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.form.markAllAsTouched();
      alert('Please fill all fields correctly.');
    }
  }

  editReference(reference: any): void {
    this.isEditMode = true;
    this.editingReferenceId = reference.id;
    this.form.patchValue({
      name: reference.name,
      mobileNumber: reference.mobileNumber,
      alternativeMobileNumber: reference.alternativeMobileNumber,
      emailId: reference.emailId,
      dateOfBirth: reference.dateOfBirth ? reference.dateOfBirth.split('T')[0] : '',
      remark: reference.remark
    });
    window.scrollTo(0, 0);
  }

  deleteReference(id: number, name: string): void {
    if (confirm(`Are you sure you want to delete reference "${name}"?`)) {
      this.loading = true;
      this.referenceService.deleteReference(id).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            alert('Reference deleted successfully!');
            this.fetchReferences();
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

  reset(): void {
    this.form.reset();
    this.isEditMode = false;
    this.editingReferenceId = null;
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (control?.hasError('required')) {
      return `${this.getLabelName(field)} is required`;
    }
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
      name: 'Reference Name',
      mobileNumber: 'Mobile Number',
      alternativeMobileNumber: 'Alternative Mobile Number',
      emailId: 'Email ID',
      dateOfBirth: 'Date of Birth',
      remark: 'Remark'
    };
    return labels[field] || field;
  }
}
