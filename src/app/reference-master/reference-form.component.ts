import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReferenceService } from '../services/reference.service';

@Component({
  selector: 'app-reference-form',
  templateUrl: './reference-form.component.html',
  styleUrls: ['./reference-form.component.css']
})
export class ReferenceFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEditMode = false;
  referenceId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private referenceService: ReferenceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.referenceId = Number(id);
        this.loadReference(this.referenceId);
      } else {
        this.isEditMode = false;
        this.referenceId = null;
      }
    });
  }

  buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      alternativeMobileNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      emailId: ['', [Validators.email]],
      dateOfBirth: [''],
      remark: ['']
    });
  }

  loadReference(id: number): void {
    this.loading = true;
    this.referenceService.getReferenceById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          const reference = response.data;
          this.form.patchValue({
            name: reference.name || '',
            mobileNumber: reference.mobileNumber || '',
            alternativeMobileNumber: reference.alternativeMobileNumber || '',
            emailId: reference.emailId || '',
            dateOfBirth: reference.dateOfBirth ? reference.dateOfBirth.split('T')[0] : '',
            remark: reference.remark || ''
          });
        } else {
          alert(response.message || 'Reference not found.');
          this.router.navigate(['/reference-master']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading reference:', error);
        alert('Unable to load reference.');
        this.router.navigate(['/reference-master']);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Please fill all fields correctly.');
      return;
    }

    this.loading = true;
    const payload = this.form.value;
    const request$ = this.isEditMode && this.referenceId
      ? this.referenceService.updateReference(this.referenceId, payload)
      : this.referenceService.saveReference(payload);

    request$.subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          const message = this.isEditMode ? 'Reference updated successfully.' : 'Reference saved successfully.';
          alert(message);
          this.router.navigate(['/reference-master']);
        } else {
          alert(response.message || 'Unable to save reference.');
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error saving reference:', error);
        alert(error.error?.message || error.message || 'Unable to save reference.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/reference-master']);
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
      if (field === 'mobileNumber' || field === 'alternativeMobileNumber') {
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
