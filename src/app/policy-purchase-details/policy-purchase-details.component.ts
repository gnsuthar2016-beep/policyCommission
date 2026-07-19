import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PolicyService } from '../services/policy.service';
import { MiscMasterService } from '../services/misc-master.service';
import { CustomerService } from '../services/customer.service';
import { ReferenceService } from '../services/reference.service';
import { formatDateToISO, formatDateToDisplay, parseToISO } from '../utils/date-utils';

@Component({
  selector: 'app-policy-purchase-details',
  templateUrl: './policy-purchase-details.component.html',
  styleUrls: ['./policy-purchase-details.component.css']
})
export class PolicyPurchaseDetailsComponent implements OnInit {
  form!: FormGroup;
  documentForm!: FormGroup;
  addCustomerForm!: FormGroup;
  addReferenceForm!: FormGroup;
  documents: any[] = [];
  documentUploadError = '';
  isEditMode = false;
  policyId: number | null = null;
  loading = false;
  pageTitle = 'Add New Policy';
  showAddCustomerModal = false;
  addingCustomer = false;
  showAddReferenceModal = false;
  addingReference = false;

  // Dropdown options - will be populated from database
  customerNames: any[] = [];
  policyTypes: any[] = [];
  referenceNames: any[] = [];
  companyNames: any[] = [];
  insuranceTypes: any[] = [];
  insuranceBranches: any[] = [];
  productNames: any[] = [];
  vehicleMakes: any[] = [];
  vehicleModels: any[] = [];
  registrationNumbers: any[] = [];
  documentTypes: any[] = [];
  policyImportErrors: string[] = [];
  policyImportLoading = false;

  // Filtered options for autocomplete
  filteredCustomerNames: any[] = [];
  filteredReferenceNames: any[] = [];
  showCustomerDropdown = false;
  showReferenceDropdown = false;
  periodToAutoFilled = false;

  constructor(
    private fb: FormBuilder,
    private policyService: PolicyService,
    private miscMasterService: MiscMasterService,
    private customerService: CustomerService,
    private referenceService: ReferenceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  importPolicies(files: FileList | null): void {
    this.policyImportErrors = [];
    if (!files || files.length === 0) {
      alert('Please select an Excel file to import.');
      return;
    }
    const file = files[0];
    this.policyImportLoading = true;
    this.policyService.importPolicies(file).subscribe({
      next: (response) => {
        this.policyImportLoading = false;
        if (response.success) {
          const results = response.results || [];
          const failedRows = results.filter((row: any) => !row.success);
          if (failedRows.length === 0) {
            alert('Policies imported successfully!');
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
            this.policyImportErrors = allErrors;
            if (failedRows.length > 10) {
              this.policyImportErrors.push(`... and ${failedRows.length - 10} more rows with errors`);
            }
          }
        } else {
          this.policyImportErrors = [response.message || 'Import failed.'];
        }
      },
      error: (error) => {
        this.policyImportLoading = false;
        console.error('Error importing policies:', error);
        this.policyImportErrors = [error.error?.message || error.message || 'Error importing policies.'];
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.initializeDocumentForm();
    this.initializeAddCustomerForm();
    this.initializeAddReferenceForm();
    
    this.setupDateInputNormalization(this.form, 'periodFrom');
    this.setupDateInputNormalization(this.form, 'periodTo');
    this.setupDateInputNormalization(this.form, 'policyDate');
    this.setupDateInputNormalization(this.addCustomerForm, 'dateOfBirth');
    this.setupDateInputNormalization(this.addReferenceForm, 'dateOfBirth');

    // Load Customer names and Misc Master values for all dropdowns
    this.loadCustomerNames();
    this.loadReferenceNames();
    this.loadMiscMasterValues();

    // Setup automatic calculation for Net Premium
    this.setupPremiumCalculationListeners();
    
    // Check for route params to determine if in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.policyId = +params['id'];
        this.isEditMode = true;
        this.pageTitle = 'Edit Policy Details';
        this.loadPolicyData(this.policyId);
      } else {
        this.isEditMode = false;
        this.pageTitle = 'Add New Policy';
      }
    });
  }

  // Validator to ensure date is parseable to ISO (accepts DD-MM-YYYY or YYYY-MM-DD)
  private dateValidator() {
    return (control: any) => {
      const v = control.value;
      if (v === null || v === undefined || v === '') return null;
      const iso = parseToISO(v);
      return iso ? null : { invalidDateFormat: true };
    };
  }

  // Helper method to format date for display in inputs (DD-MM-YYYY)
  private formatDateForInput(dateValue: any): string {
    return formatDateToDisplay(dateValue, '');
  }

  onDateInputChange(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement | null;
    const control = this.form.get(controlName);
    if (!input || !control) {
      return;
    }

    const value = input.value?.trim() || '';
    if (!value) {
      control.setValue('', { emitEvent: false });
      return;
    }

    const iso = parseToISO(value);
    if (iso) {
      // normalize to display form only when parseable
      control.setValue(formatDateToDisplay(iso, ''), { emitEvent: false });
      control.setErrors(null);
    } else {
      // leave user input as-is; validator will mark invalid when touched/submitted
      // do not override errors here
    }
  }

  onDateTextInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement | null;
    const control = this.form.get(controlName);
    if (!input || !control) {
      return;
    }

    const rawValue = input.value?.trim() || '';
    if (!rawValue) {
      control.setValue('', { emitEvent: false });
      return;
    }
    const iso = parseToISO(rawValue);
    if (!iso) return;
    control.setValue(formatDateToDisplay(iso, ''), { emitEvent: false });
  }

  onCalendarSelection(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement | null;
    const control = this.form.get(controlName);
    if (!input || !control) {
      return;
    }

    if (!input.value) {
      control.setValue('', { emitEvent: false });
      return;
    }
    const iso = parseToISO(input.value);
    control.setValue(iso ? formatDateToDisplay(iso, '') : input.value, { emitEvent: false });
  }

  private setupDateInputNormalization(form: FormGroup, controlName: string): void {
    const control = form.get(controlName);
    if (!control) {
      return;
    }

    control.valueChanges.subscribe((value: any) => {
      if (value === null || value === undefined || value === '') {
        return;
      }
      const iso = parseToISO(value);
      if (iso) {
        const display = formatDateToDisplay(iso, '');
        if (display !== value) {
          control.setValue(display, { emitEvent: false });
        }
      }
    });
  }

  loadCustomerNames(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          // Extract just the names from customers and filter out N/A, empty, and invalid entries
          this.customerNames = response.data
            .map((customer: any) => customer.name)
            .filter((name: string) => {
              // Only keep non-empty, non-N/A names
              return name && 
                     name.trim() !== '' && 
                     name.toLowerCase() !== 'n/a' &&
                     name !== null &&
                     name !== undefined;
            })
            .sort();
          // Initialize filtered list
          this.filteredCustomerNames = this.customerNames;
          console.log('Loaded Customer Names:', this.customerNames);
        } else {
          this.customerNames = [];
          this.filteredCustomerNames = [];
        }
      },
      error: (error) => {
        console.warn('Error loading customer names:', error);
        this.customerNames = [];
        this.filteredCustomerNames = [];
      }
    });
  }

  loadReferenceNames(): void {
    this.referenceService.getAllReferences().subscribe({
      next: (response) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          // Extract just the names from references
          this.referenceNames = response.data.map((reference: any) => reference.name);
          // Initialize filtered list
          this.filteredReferenceNames = this.referenceNames;
        } else {
          this.referenceNames = [];
          this.filteredReferenceNames = [];
        }
      },
      error: (error) => {
        console.warn('Error loading reference names:', error);
        this.referenceNames = [];
        this.filteredReferenceNames = [];
      }
    });
  }

  loadMiscMasterValues(): void {
    // Mapping of dropdown property names to Misc Master type names
    const dropdownTypeMap = [
      { property: 'policyTypes', type: 'Policy Type' },
      { property: 'companyNames', type: 'Company Name' },
      { property: 'insuranceTypes', type: 'Insurance Type' },
      { property: 'insuranceBranches', type: 'Insurance Branch' },
      { property: 'productNames', type: 'Product Name' },
      { property: 'vehicleMakes', type: 'Vehicle Make' },
      { property: 'vehicleModels', type: 'Vehicle Model' },
      { property: 'documentTypes', type: 'Document Type' }
    ];

    // Fetch values for each dropdown type
    dropdownTypeMap.forEach(mapping => {
      this.miscMasterService.getMiscMasterByType(mapping.type).subscribe({
        next: (response) => {
          if (response.success && response.data && Array.isArray(response.data)) {
            // Map the response to extract just the names
            (this as any)[mapping.property] = response.data.map((item: any) => item.name);
          } else {
            // Keep empty array if no data is found
            (this as any)[mapping.property] = [];
          }
        },
        error: (error) => {
          console.warn(`Error loading ${mapping.type} from Misc Master:`, error);
          // Keep empty array on error
          (this as any)[mapping.property] = [];
        }
      });
    });
  }

  loadPolicyData(policyId: number): void {
    this.loading = true;
    this.policyService.getPolicyById(policyId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          const policy = response.data;
          
          console.log('Policy Data from API:', policy);
          console.log('Premium Source from API:', policy.premiumSource);
          
          // Extra validation: Check if customer name is N/A or invalid
          if (!policy.customerName || policy.customerName === 'N/A' || policy.customerName.trim() === '') {
            alert('⚠ ERROR: This policy has an invalid customer name in the database (N/A or empty).\n\nPlease contact the administrator to correct this data before editing.');
            this.router.navigate(['/policies']);
            return;
          }
          
          // Format date fields for proper display in HTML date inputs
          const formattedPolicy = {
            ...policy,
            periodFrom: this.formatDateForInput(policy.periodFrom),
            periodTo: this.formatDateForInput(policy.periodTo),
            policyDate: this.formatDateForInput(policy.policyDate),
            // Ensure premiumSource is set correctly
            premiumSource: policy.premiumSource || 'Net Premium'
          };
          
          console.log('Formatted Policy with premiumSource:', formattedPolicy.premiumSource);
          
          this.form.patchValue(formattedPolicy);
          
          // Verify premiumSource was set in the form
          console.log('Form premiumSource value after patchValue:', this.form.get('premiumSource')?.value);
          
          // Recalculate derived fields (GST and Final Premium)
          this.calculateGstAndFinalPremium();
          // Recalculate Ref. Brokerage Amount
          this.calculateRefBrokerageAmount();
          // Load documents
          if (policy.documents && Array.isArray(policy.documents)) {
            this.documents = policy.documents.map((doc: any, index: number) => ({
              id: doc.id || index + 1,
              documentType: doc.documentType,
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              uploadDate: doc.uploadDate,
              filePath: doc.filePath
            }));
          }
        } else {
          alert('Error loading policy: ' + response.message);
          this.router.navigate(['/policies']);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading policy:', error);
        alert('Error loading policy details. Redirecting to list...');
        this.router.navigate(['/policies']);
      }
    });
  }

  initializeDocumentForm(): void {
    this.documentForm = this.fb.group({
      documentType: ['', Validators.required]
    });
  }

  initializeAddCustomerForm(): void {
    this.addCustomerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      alternativeMobileNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      emailId: ['', [ Validators.email]],
      dateOfBirth: ['', []],
      remark: ['', []]
    });
  }

  initializeAddReferenceForm(): void {
    this.addReferenceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      alternativeMobileNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      emailId: ['', [ Validators.email]],
      dateOfBirth: ['', []],
      remark: ['', []]
    });
  }

  initializeForm(): void {
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      policyType: ['', Validators.required],
      policyNumber: ['', [Validators.required, Validators.minLength(5)]],
      insuranceBranch: [''],
      referenceName: ['', Validators.required],
      companyName: ['', Validators.required],
      insuranceType: [''],
      productName: ['', Validators.required],
      periodFrom: ['', [Validators.required, this.dateValidator()]],
      periodTo: ['', [Validators.required, this.dateValidator()]],
      policyDate: ['', [this.dateValidator()]],
      basicODPremium: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      tpPremium: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      ncb: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      netPremium: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      gstPercent: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      gstAmount: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      finalPremium: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      premiumSource: ['Net Premium', Validators.required],
      refBrokerageOn: ['', [Validators.required,Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      refBrokeragePercent: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      refBrokerageAmount: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      totalIDV: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      make: [''],
      model: [''],
      registrationNumber: ['']
    });
  }

  onCustomerChange(event: any): void {
    const selectedValue = event.target.value;
    console.log('Customer selected from dropdown:', selectedValue);
    this.form.get('customerName')?.setValue(selectedValue);
  }

  // Filter customer names for autocomplete
  filterCustomerNames(searchText: string): void {
    const trimmedSearch = searchText.trim().toLowerCase();
    
    if (trimmedSearch === '') {
      this.filteredCustomerNames = this.customerNames;
    } else {
      this.filteredCustomerNames = this.customerNames.filter(name =>
        name.toLowerCase().includes(trimmedSearch)
      );
    }
    
    this.showCustomerDropdown = trimmedSearch !== '' && this.filteredCustomerNames.length > 0;
  }

  // Handle customer name input
  onCustomerNameInput(event: any): void {
    const inputValue = event.target.value;
    this.form.get('customerName')?.setValue(inputValue, { emitEvent: false });
    this.filterCustomerNames(inputValue);
  }

  // Select customer from filtered list
  selectCustomer(customerName: string): void {
    this.form.get('customerName')?.setValue(customerName);
    this.showCustomerDropdown = false;
    this.filteredCustomerNames = [];
  }

  // Filter reference names for autocomplete
  filterReferenceNames(searchText: string): void {
    const trimmedSearch = searchText.trim().toLowerCase();
    
    if (trimmedSearch === '') {
      this.filteredReferenceNames = this.referenceNames;
    } else {
      this.filteredReferenceNames = this.referenceNames.filter(name =>
        name.toLowerCase().includes(trimmedSearch)
      );
    }
    
    this.showReferenceDropdown = trimmedSearch !== '' && this.filteredReferenceNames.length > 0;
  }

  // Handle reference name input
  onReferenceNameInput(event: any): void {
    const inputValue = event.target.value;
    this.form.get('referenceName')?.setValue(inputValue, { emitEvent: false });
    this.filterReferenceNames(inputValue);
  }

  // Select reference from filtered list
  selectReference(referenceName: string): void {
    this.form.get('referenceName')?.setValue(referenceName);
    this.showReferenceDropdown = false;
    this.filteredReferenceNames = [];
  }

  // Close customer dropdown with delay
  onCustomerBlur(): void {
    setTimeout(() => {
      this.showCustomerDropdown = false;
    }, 150);
  }

  // Close reference dropdown with delay
  onReferenceBlur(): void {
    setTimeout(() => {
      this.showReferenceDropdown = false;
    }, 150);
  }

  // Close dropdowns when clicking outside
  submit(): void {
    if (this.form.valid) {
      // Prepare policy data with documents
      const formData = this.form.value;
      
      // Ensure customerName has a valid value (not N/A or empty)
      if (!formData.customerName || formData.customerName.trim() === '' || formData.customerName === 'N/A') {
        alert('Please select a valid customer name from the dropdown');
        this.form.get('customerName')?.markAsTouched();
        return;
      }
      
      console.log('Form Data Before Submit:', formData);
      console.log('Customer Name Being Submitted:', formData.customerName);
      
      const policyPayload = {
        ...formData,
        // Ensure customerName is properly set to the selected value
        customerName: formData.customerName.trim(),
        // Ensure premiumSource is included
        premiumSource: formData.premiumSource || 'Net Premium',
        // Ensure dates are in ISO string format
        periodFrom: parseToISO(formData.periodFrom),
        periodTo: parseToISO(formData.periodTo),
        policyDate: parseToISO(formData.policyDate)
      };
      
      console.log('Complete Payload Being Sent to API:', policyPayload);
      console.log('premiumSource in Payload:', policyPayload.premiumSource);

      // Call API to save or update policy based on mode
      const apiCall = this.isEditMode && this.policyId
        ? this.policyService.updatePolicy(this.policyId, policyPayload)
        : this.policyService.savePolicy(policyPayload);

      apiCall.subscribe({
        next: async (response) => {
          if (response.success) {
            const policyId = response.policyId;
            const mode = this.isEditMode ? 'updated' : 'created';
            
            if (!this.isEditMode && this.documents.some(doc => !!doc.file && !doc.filePath)) {
              await this.uploadPendingDocuments(policyId);
            }

            alert(`Policy Details ${mode} Successfully!\nPolicy ID: ${policyId}`);
            console.log('Policy saved:', response);
            this.router.navigate(['/policies']);
          } else {
            alert('Error saving policy: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Error saving policy:', error);
          alert('Error saving policy details. Please try again.');
        }
      });
    } else {
      this.form.markAllAsTouched();
      alert('Please fill all required fields correctly.');
    }
  }

  cancel(): void {
    this.router.navigate(['/policies']);
  }

  openAddCustomerModal(): void {
    this.showAddCustomerModal = true;
    this.addCustomerForm.reset();
  }

  closeAddCustomerModal(): void {
    this.showAddCustomerModal = false;
    this.addCustomerForm.reset();
  }

  saveNewCustomer(): void {
    if (this.addCustomerForm.valid) {
      this.addingCustomer = true;
      const newCustomer = this.addCustomerForm.value;
      newCustomer.dateOfBirth = newCustomer.dateOfBirth ? formatDateToISO(newCustomer.dateOfBirth, '') : '';

      this.customerService.saveCustomer(newCustomer).subscribe({
        next: (response) => {
          this.addingCustomer = false;
          if (response.success) {
            alert('Customer added successfully!');
            this.closeAddCustomerModal();
            // Reload customer list
            this.loadCustomerNames();
          } else {
            alert('Error: ' + response.message);
          }
        },
        error: (error) => {
          this.addingCustomer = false;
          console.error('Error saving customer:', error);
          alert('Error saving customer: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.addCustomerForm.markAllAsTouched();
      alert('Please fill all fields correctly.');
    }
  }

  goToAddCustomer(): void {
    this.openAddCustomerModal();
  }

  openAddReferenceModal(): void {
    this.showAddReferenceModal = true;
    this.addReferenceForm.reset();
  }

  closeAddReferenceModal(): void {
    this.showAddReferenceModal = false;
    this.addReferenceForm.reset();
  }

  saveNewReference(): void {
    if (this.addReferenceForm.valid) {
      this.addingReference = true;
      const newReference = this.addReferenceForm.value;
      newReference.dateOfBirth = newReference.dateOfBirth ? formatDateToISO(newReference.dateOfBirth, '') : '';

      this.referenceService.saveReference(newReference).subscribe({
        next: (response) => {
          this.addingReference = false;
          if (response.success) {
            alert('Reference added successfully!');
            this.closeAddReferenceModal();
            // Reload reference list
            this.loadReferenceNames();
          } else {
            alert('Error: ' + response.message);
          }
        },
        error: (error) => {
          this.addingReference = false;
          console.error('Error saving reference:', error);
          alert('Error saving reference: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.addReferenceForm.markAllAsTouched();
      alert('Please fill all fields correctly.');
    }
  }

  goToAddReference(): void {
    this.openAddReferenceModal();
  }

  reset(): void {
    this.form.reset();
    this.documents = [];
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

    if (file.size > 5 * 1024 * 1024) {
      this.documentUploadError = 'Maximum file size is 5MB.';
      return;
    }

    const documentEntry: any = {
      id: this.documents.length + 1,
      documentType,
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(2) + ' KB',
      uploadDate: new Date().toISOString().split('T')[0]
    };

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    if (this.policyId === null) {
      this.documentUploadError = 'Policy ID is not set. Please save the policy first.';
      return;
    }

    this.policyService.addDocumentToPolicy(this.policyId, formData).subscribe({
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
      this.policyService.deleteDocument(document.id).subscribe({
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

  /**
   * Download document to local system
   * If the document has a file object, it's a newly uploaded file
   * Otherwise, it's from the database and needs to be fetched from server
   */
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

  /**
   * Helper method to download a file to the local system
   * Creates a blob URL and triggers a download
   */
  private downloadFile(file: File | Blob, fileName: string): void {
    try {
      console.log('downloadFile called with:', fileName, 'File object:', file);
      
      // Create a blob from the file
      const blob = file instanceof File ? file : file;
      console.log('Blob created:', blob.size, 'bytes');
      
      // Use the modern approach with fetch and blob
      const blobUrl = window.URL.createObjectURL(blob);
      console.log('Object URL created:', blobUrl);
      
      // Create an invisible anchor element
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      anchor.style.position = 'absolute';
      anchor.style.left = '-9999px';
      anchor.style.visibility = 'hidden';
      
      document.body.appendChild(anchor);
      console.log('Anchor appended to body, triggering click');
      
      // Trigger the click synchronously
      anchor.click();
      
      console.log('Click triggered');
      
      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(blobUrl);
        console.log('Cleanup completed');
      }, 100);
      
      // Show success message after a short delay
      setTimeout(() => {
        alert(`Document "${fileName}" downloaded successfully!`);
      }, 150);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      console.error('Error details:', (error as Error).toString());
      alert('Error downloading file: ' + ((error instanceof Error) ? error.message : String(error)));
    }
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
    if (control?.hasError('invalidDateFormat')) {
      return `${this.getLabelName(field)} must be a valid date (dd-MM-yyyy)`;
    }
    if (control?.hasError('pattern')) {
      return `${this.getLabelName(field)} must be a valid number`;
    }
    return '';
  }

  getCustomerErrorMessage(field: string): string {
    const control = this.addCustomerForm.get(field);
    if (control?.hasError('required')) {
      return `${this.getCustomerLabelName(field)} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${this.getCustomerLabelName(field)} must be at least ${minLength} characters`;
    }
    if (control?.hasError('pattern')) {
      if (field === 'mobileNumber') {
        return 'Mobile number must be 10 digits';
      }
      return `${this.getCustomerLabelName(field)} format is invalid`;
    }
    if (control?.hasError('email')) {
      return 'Email ID format is invalid';
    }
    return '';
  }

  getLabelName(field: string): string {
    const labels: { [key: string]: string } = {
      customerName: 'Customer Name',
      policyType: 'Policy Type',
      policyNumber: 'Policy Number',
      referenceName: 'Reference Name',
      companyName: 'Company Name',
      insuranceType: 'Insurance Type',
      productName: 'Product Name',
      periodFrom: 'Period From',
      periodTo: 'Period To',
      basicODPremium: 'Basic / OD Premium',
      tpPremium: 'TP Premium',
      ncb: 'NCB',
      netPremium: 'Net Premium',
      gstPercent: 'GST %',
      gstAmount: 'GST Amount',
      finalPremium: 'Final Premium',
      refBrokerageOn: 'Ref. Brokerage On',
      refBrokeragePercent: 'Ref Brokerage %',
      refBrokerageAmount: 'Ref. Brokerage Amount',
      totalIDV: 'Total IDV / SA',
      make: 'Make',
      model: 'Model',
      registrationNumber: 'Registration Number'
    };
    return labels[field] || field;
  }

  getCustomerLabelName(field: string): string {
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

  getReferenceErrorMessage(field: string): string {
    const control = this.addReferenceForm.get(field);
    if (control?.hasError('required')) {
      return `${this.getReferenceLabelName(field)} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${this.getReferenceLabelName(field)} must be at least ${minLength} characters`;
    }
    if (control?.hasError('pattern')) {
      if (field === 'mobileNumber') {
        return 'Mobile number must be 10 digits';
      }
      return `${this.getReferenceLabelName(field)} format is invalid`;
    }
    if (control?.hasError('email')) {
      return 'Email ID format is invalid';
    }
    return '';
  }

  getReferenceLabelName(field: string): string {
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

  private async uploadPendingDocuments(policyId: number): Promise<void> {
    for (const document of this.documents.filter(doc => doc.file && !doc.filePath)) {
      const formData = new FormData();
      formData.append('documentType', document.documentType);
      formData.append('document', document.file);

      try {
        const response: any = await firstValueFrom(this.policyService.addDocumentToPolicy(policyId, formData));
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

  get documentTypeControl() {
    return this.documentForm.get('documentType') as any;
  }

  /**
   * Calculate Net Premium based on OD Premium, TP Premium, and NCB percentage
   * Formula: Net Premium = (OD Premium + TP Premium) - [(OD Premium + TP Premium) * NCB% / 100]
   */
  calculateNetPremium(): void {
    const basicODPremium = this.form.get('basicODPremium')?.value || 0;
    const tpPremium = this.form.get('tpPremium')?.value || 0;
    const ncbPercent = this.form.get('ncb')?.value || 0;

    // Calculate total of OD and TP premiums
    const totalPremium = parseFloat(basicODPremium) + parseFloat(tpPremium);

    // Calculate NCB amount (NCB percentage of total premium)
    const ncbAmount = (totalPremium * parseFloat(ncbPercent)) / 100;

    // Calculate Net Premium (Total - NCB Amount)
    const netPremium = totalPremium - ncbAmount;

    // Update the Net Premium field with calculated value (rounded to 2 decimal places)
    this.form.patchValue(
      { netPremium: netPremium.toFixed(2) },
      { emitEvent: false }
    );
  }

  /**
   * Get the calculated NCB amount for display
   * Returns the amount deducted based on NCB percentage
   */
  getNcbAmount(): number {
    const basicODPremium = this.form.get('basicODPremium')?.value || 0;
    const tpPremium = this.form.get('tpPremium')?.value || 0;
    const ncbPercent = this.form.get('ncb')?.value || 0;

    const totalPremium = parseFloat(basicODPremium) + parseFloat(tpPremium);
    const ncbAmount = (totalPremium * parseFloat(ncbPercent)) / 100;

    return ncbAmount;
  }

  /**
   * Get the calculated GST amount for display
   * Returns GST Amount calculated from Net Premium and GST %
   */
  getGstAmount(): number {
    const netPremium = this.form.get('netPremium')?.value || 0;
    const gstPercent = this.form.get('gstPercent')?.value || 0;

    const gstAmount = (parseFloat(netPremium) * parseFloat(gstPercent)) / 100;

    return gstAmount;
  }

  /**
   * Calculate and update GST Amount and Final Premium
   * Formula: GST Amount = (Net Premium × GST%) / 100
   *          Final Premium = Net Premium + GST Amount
   */
  calculateGstAndFinalPremium(): void {
    const netPremium = this.form.get('netPremium')?.value || 0;
    const gstPercent = this.form.get('gstPercent')?.value || 0;

    // Calculate GST Amount
    const gstAmount = (parseFloat(netPremium) * parseFloat(gstPercent)) / 100;

    // Calculate Final Premium
    const finalPremium = parseFloat(netPremium) + gstAmount;

    // Update GST Amount field (for storing if needed)
    this.form.patchValue(
      { 
        gstAmount: gstAmount.toFixed(2),
        finalPremium: finalPremium.toFixed(2)
      },
      { emitEvent: false }
    );
  }

  /**
   * Get the calculated Final Premium for display
   * Returns Final Premium = Net Premium + GST Amount
   */
  getFinalPremium(): number {
    const netPremium = this.form.get('netPremium')?.value || 0;
    const gstAmount = this.getGstAmount();

    const finalPremium = parseFloat(netPremium) + gstAmount;

    return finalPremium;
  }

  /**
   * Get the calculated Ref. Brokerage Amount for display
   * Returns Ref. Brokerage Amount based on Net Premium × Ref Brokerage %
   */
  getRefBrokerageAmount(): number {
    const netPremium = this.form.get('netPremium')?.value || 0;
    const refBrokeragePercent = this.form.get('refBrokeragePercent')?.value || 0;

    const refBrokerageAmount = (parseFloat(netPremium) * parseFloat(refBrokeragePercent)) / 100;

    return refBrokerageAmount;
  }

  getRefBrokerageOn(): number {
    const premiumSource = this.form.get('premiumSource')?.value || 'Net Premium';
    
    if (premiumSource === 'OD Premium') {
      return this.form.get('basicODPremium')?.value || 0;
    } else {
      return this.form.get('netPremium')?.value || 0;
    }
  }

  private calculateOneYearLater(dateValue: any): string | null {
    if (!dateValue) {
      return null;
    }

    const iso = parseToISO(dateValue);
    if (!iso) return null;

    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return null;
    }

    const nextYear = new Date(date);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    nextYear.setDate(nextYear.getDate() - 1);

    return this.formatDateForInput(nextYear);
  }

  /**
   * Calculate and update Ref. Brokerage Amount
   * Formula: Ref. Brokerage Amount = Ref. Brokerage On (Selected Premium) × Ref Brokerage% / 100
   */
  calculateRefBrokerageAmount(): void {
    const refBrokerageOn = this.getRefBrokerageOn();
    const refBrokeragePercent = this.form.get('refBrokeragePercent')?.value || 0;

    // Calculate Ref. Brokerage Amount
    const refBrokerageAmount = (parseFloat(refBrokerageOn.toString()) * parseFloat(refBrokeragePercent)) / 100;

    // Update both Ref. Brokerage On and Ref. Brokerage Amount fields
    this.form.patchValue(
      { 
        refBrokerageOn: parseFloat(refBrokerageOn.toString()).toFixed(2),
        refBrokerageAmount: refBrokerageAmount.toFixed(2) 
      },
      { emitEvent: false }
    );
  }

  /**
   * Setup listeners for automatic premium calculation
   * Called when the form is initialized
   */
  setupPremiumCalculationListeners(): void {
    // Watch for changes in OD Premium, TP Premium, and NCB to update Net Premium
    const netPremiumFields = ['basicODPremium', 'tpPremium', 'ncb'];
    netPremiumFields.forEach(field => {
      this.form.get(field)?.valueChanges.subscribe(() => {
        this.calculateNetPremium();
        // Recalculate GST and Final Premium whenever Net Premium changes
        this.calculateGstAndFinalPremium();
        // Recalculate Ref. Brokerage Amount when Net Premium changes
        this.calculateRefBrokerageAmount();
      });
    });

    // Auto-fill Period To when Period From changes and Period To is empty or previously auto-filled
    this.form.get('periodFrom')?.valueChanges.subscribe((value) => {
      const periodToControl = this.form.get('periodTo');
      const currentPeriodTo = periodToControl?.value;
      const computedPeriodTo = this.calculateOneYearLater(value);

      if (!computedPeriodTo) {
        return;
      }

      if (!currentPeriodTo || currentPeriodTo === '' || this.periodToAutoFilled) {
        periodToControl?.patchValue(computedPeriodTo, { emitEvent: false });
        this.periodToAutoFilled = true;
      }
    });

    this.form.get('periodTo')?.valueChanges.subscribe(() => {
      this.periodToAutoFilled = false;
    });

    // Watch for changes in GST % to update GST Amount and Final Premium
    this.form.get('gstPercent')?.valueChanges.subscribe(() => {
      this.calculateGstAndFinalPremium();
    });

    // Watch for changes in Ref Brokerage % to update Ref. Brokerage Amount
    this.form.get('refBrokeragePercent')?.valueChanges.subscribe(() => {
      this.calculateRefBrokerageAmount();
    });

    // Watch for changes in Premium Source dropdown to update Ref. Brokerage On
    this.form.get('premiumSource')?.valueChanges.subscribe(() => {
      this.calculateRefBrokerageAmount();
    });
  }
}





//create 1 more component as customermaster and add field like name , mobile number , emailid and add this is database table as well and create list as well of client and on click of add new redirect to add new customer and fetch customer name in policy details from this customer saved in database