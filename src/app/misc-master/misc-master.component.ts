import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MiscMasterService } from '../services/misc-master.service';

@Component({
  selector: 'app-misc-master',
  templateUrl: './misc-master.component.html',
  styleUrls: ['./misc-master.component.css']
})
export class MiscMasterComponent implements OnInit {
  form!: FormGroup;
  miscItems: any[] = [];
  loading = false;
  selectedType: string = '';

  // All dropdown type options from policy details page
  dropdownTypes = [
    'Policy Type',
    'Renewal',
    'Reference Name',
    'Company Name',
    'Insurance Type',
    'Product Name',
    'Vehicle Make',
    'Vehicle Model',
    'Registration Number',
    'Document Type'
  ];

  constructor(
    private fb: FormBuilder,
    private miscMasterService: MiscMasterService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.form = this.fb.group({
      type: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onTypeChange(): void {
    const selectedType = this.form.get('type')?.value;
    if (selectedType) {
      this.selectedType = selectedType;
      this.fetchMiscMasterList(selectedType);
    } else {
      this.miscItems = [];
      this.selectedType = '';
    }
  }

  fetchMiscMasterList(type: string): void {
    this.loading = true;
    this.miscMasterService.getMiscMasterByType(type).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.miscItems = response.data;
        } else {
          this.miscItems = [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error fetching Misc Masters:', error);
        this.miscItems = [];
      }
    });
  }

  submit(): void {
    if (this.form.valid) {
      const formData = {
        type: this.form.get('type')?.value,
        name: this.form.get('name')?.value
      };

      this.loading = true;
      this.miscMasterService.saveMiscMaster(formData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            alert(`Misc Master saved successfully!\nID: ${response.id}`);
            console.log('Misc Master saved:', response);
            
            // Reset form and refresh list
            this.form.get('name')?.reset();
            this.fetchMiscMasterList(formData.type);
          } else {
            alert('Error: ' + response.message);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error saving Misc Master:', error);
          alert('Error saving Misc Master: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.form.markAllAsTouched();
      alert('Please fill all required fields correctly.');
    }
  }

  deleteMiscMaster(id: number, name: string): void {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.loading = true;
      this.miscMasterService.deleteMiscMaster(id).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            alert('Misc Master deleted successfully!');
            this.fetchMiscMasterList(this.selectedType);
          } else {
            alert('Error: ' + response.message);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error deleting Misc Master:', error);
          alert('Error deleting Misc Master: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  reset(): void {
    this.form.reset();
    this.miscItems = [];
    this.selectedType = '';
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (control?.hasError('required')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${minLength} characters`;
    }
    return '';
  }
}
