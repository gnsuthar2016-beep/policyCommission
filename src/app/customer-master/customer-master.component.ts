import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CustomerService } from '../services/customer.service';
import { MiscMasterService } from '../services/misc-master.service';

@Component({
  selector: 'app-customer-master',
  templateUrl: './customer-master.component.html',
  styleUrls: ['./customer-master.component.css']
})
export class CustomerMasterComponent implements OnInit {
  form!: FormGroup;
  documentForm!: FormGroup;
  documents: any[] = [];
  documentUploadError = '';
  customerImportErrors: string[] = [];
  customerImportLoading = false;
  customers: any[] = [];
  loading = false;
  isEditMode = false;
  editingCustomerId: number | null = null;
  documentTypes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private miscMasterService: MiscMasterService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializeDocumentForm();
    this.loadDocumentTypes();
    this.fetchCustomers();
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
          if (successfulRows.length > 0) {
            this.fetchCustomers();
          }

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

  initializeDocumentForm(): void {
    this.documentForm = this.fb.group({
      documentType: ['', Validators.required]
    });
  }

  loadDocumentTypes(): void {
    this.miscMasterService.getMiscMasterByType('Document Type').subscribe({
      next: (response) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          this.documentTypes = response.data.map((item: any) => item.name);
        } else {
          this.documentTypes = [];
        }
      },
      error: (error) => {
        console.warn('Error loading document types:', error);
        this.documentTypes = [];
      }
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
        next: async (response) => {
          this.loading = false;
          if (response.success) {
            const customerId = response.id || response.data?.id || this.editingCustomerId;
            const action = this.isEditMode ? 'updated' : 'added';
            
            if (!this.isEditMode && this.documents.some(doc => !!doc.file && !doc.filePath)) {
              await this.uploadPendingDocuments(customerId);
            }
            
            alert(`Customer ${action} successfully!`);
            this.form.reset();
            this.documents = [];
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
    
    if (customer.documents && Array.isArray(customer.documents)) {
      this.documents = customer.documents.map((doc: any) => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadDate: doc.uploadDate,
        filePath: doc.filePath
      }));
    } else {
      this.documents = [];
    }
    
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
    this.documents = [];
    this.documentUploadError = '';
    this.isEditMode = false;
    this.editingCustomerId = null;
  }

  addDocument(fileInput: HTMLInputElement): void {
    this.documentUploadError = '';

    if (this.documentForm.invalid || !fileInput.files?.length) {
      this.documentForm.markAllAsTouched();
      this.documentUploadError = 'Please select a document and type before uploading.';
      return;
    }

    const file = fileInput.files[0];
    const documentType = this.documentForm.get('documentType')?.value;

    if (!file) {
      this.documentUploadError = 'Please select a valid file.';
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      this.documentUploadError = 'Only image and PDF files are allowed.';
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      this.documentUploadError = 'Maximum file size is 1MB.';
      return;
    }

    const documentEntry: any = {
      id: this.documents.length + 1,
      documentType,
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(2) + ' KB',
      uploadDate: new Date().toLocaleString()
    };

    if (this.isEditMode && this.editingCustomerId) {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('document', file);

      this.customerService.addDocumentToCustomer(this.editingCustomerId, formData).subscribe({
        next: (response) => {
          if (response.success) {
            const savedDoc = response.data;
            this.documents.push({
              id: savedDoc.id,
              documentType: savedDoc.documentType,
              fileName: savedDoc.fileName,
              fileSize: savedDoc.fileSize,
              uploadDate: savedDoc.uploadDate,
              filePath: savedDoc.filePath
            });
            this.documentForm.reset();
            fileInput.value = '';
          } else {
            this.documentUploadError = response.message || 'Unable to upload document.';
          }
        },
        error: (error) => {
          this.documentUploadError = error.error?.message || 'Unable to upload document.';
          console.error('Error uploading document:', error);
        }
      });
      return;
    }

    documentEntry.file = file;
    this.documents.push(documentEntry);
    this.documentForm.reset();
    fileInput.value = '';
  }

  removeDocument(id: number): void {
    const document = this.documents.find(doc => doc.id === id);
    if (!document) {
      return;
    }

    if (document.filePath && document.id && !document.file) {
      this.customerService.deleteCustomerDocument(document.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.documents = this.documents.filter(doc => doc.id !== id);
          } else {
            alert('Unable to delete document: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          alert('Error deleting document. Please try again.');
        }
      });
      return;
    }

    this.documents = this.documents.filter(doc => doc.id !== id);
  }

  viewDocument(document: any): void {
    if (document.filePath) {
      window.open(document.filePath, '_blank');
      return;
    }

    if (document.file) {
      this.downloadFile(document.file, document.fileName);
      return;
    }

    alert(`Document: ${document.fileName}\nType: ${document.documentType}\nSize: ${document.fileSize}\n\nNo preview or download URL is available.`);
  }

  private downloadFile(file: File | Blob, fileName: string): void {
    try {
      const blob = file instanceof File ? file : file;
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      anchor.style.position = 'absolute';
      anchor.style.left = '-9999px';
      anchor.style.visibility = 'hidden';
      
      document.body.appendChild(anchor);
      anchor.click();
      
      setTimeout(() => {
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      setTimeout(() => {
        alert(`Document "${fileName}" downloaded successfully!`);
      }, 150);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  private async uploadPendingDocuments(customerId: number): Promise<void> {
    for (const document of this.documents.filter(doc => doc.file && !doc.filePath)) {
      const formData = new FormData();
      formData.append('documentType', document.documentType);
      formData.append('document', document.file);

      try {
        const response: any = await firstValueFrom(this.customerService.addDocumentToCustomer(customerId, formData));
        if (response.success) {
          document.id = response.data.id;
          document.filePath = response.data.filePath;
          delete document.file;
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (error) {
        console.error('Error uploading pending document:', error);
        alert(`Failed to upload document ${document.fileName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
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

  get documentTypeControl() {
    return this.documentForm.get('documentType') as any;
  }
}
