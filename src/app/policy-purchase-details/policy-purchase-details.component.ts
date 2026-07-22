import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PolicyService } from '../services/policy.service';
import { MiscMasterService } from '../services/misc-master.service';
import { CustomerService } from '../services/customer.service';
import { ReferenceService } from '../services/reference.service';
import { PolicyDocumentExtractService } from '../services/policy-document-extract.service';

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
  policyExtractionLoading = false;
  submitErrorMessage = '';
  policyNumberWarning = '';

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
    private policyDocumentExtractService: PolicyDocumentExtractService,
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
    
    // Load Customer names and Misc Master values for all dropdowns
    this.loadCustomerNames();
    this.loadReferenceNames();
    this.loadMiscMasterValues();

    // Setup automatic calculation and date listener for period fields
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

  // Helper method to format date for HTML date input (YYYY-MM-DD)
  private formatDateForInput(dateValue: any): string {
    if (!dateValue) return '';
    
    let date: Date;
    
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return '';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    
    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  loadCustomerNames(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          // Keep full customer objects (name + address + mobile) for richer autocomplete
          this.customerNames = response.data
            .map((customer: any) => ({
              name: customer.name || '',
              remark: customer.remark || customer.notes || customer.remarkText || '',
              mobileNumber: customer.mobileNumber || customer.mobile || customer.mobile_no || ''
            }))
            .filter((c: any) => {
              return c.name && c.name.trim() !== '' && c.name.toLowerCase() !== 'n/a';
            })
            .sort((a: any, b: any) => a.name.localeCompare(b.name));

          // Initialize filtered list with objects
          this.filteredCustomerNames = this.customerNames;
          console.log('Loaded Customer Names (objects):', this.customerNames);
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
    this.referenceService.getAllReferences(true).subscribe({
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
          const discountValue = policy.premiumDiscount != null
            ? Number(policy.premiumDiscount)
            : (policy.discount != null ? Number(policy.discount) : 0);

          const formattedPolicy = {
            ...policy,
            discount: discountValue,
            periodFrom: this.formatDateForInput(policy.periodFrom),
            periodTo: this.formatDateForInput(policy.periodTo),
            policyDate: this.formatDateForInput(policy.policyDate),
            // Ensure premiumSource is set correctly
            premiumSource: policy.premiumSource || 'Net Premium'
          };
          
          console.log('Formatted Policy with premiumSource:', formattedPolicy.premiumSource);
          
          this.form.patchValue(formattedPolicy);
          // this.syncCalculatedPremiumFields();
          
          // Verify premiumSource was set in the form
          console.log('Form premiumSource value after patchValue:', this.form.get('premiumSource')?.value);
          
          // Recalculate derived fields (GST and Final Premium)
          // this.calculateGstAndFinalPremium();
          // Recalculate Ref. Brokerage Amount
          // this.calculateRefBrokerageAmount();
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
      periodFrom: ['', Validators.required],
      periodTo: ['', Validators.required],
      policyDate: [''],
      basicODPremium: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      tpPremium: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      ncb: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      ncbAmount: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      netPremium: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      discount: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      gstPercent: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      gstAmount: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      finalPremium: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      premiumSource: ['Net Premium', Validators.required],
      refBrokerageOn: [0, [Validators.required,Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      refBrokeragePercent: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      refBrokerageAmount: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
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
      this.filteredCustomerNames = [];
    } else {
      this.filteredCustomerNames = this.customerNames.filter((c: any) => {
        return (
          (c.name || '').toLowerCase().includes(trimmedSearch) ||
          (c.remark || '').toLowerCase().includes(trimmedSearch) ||
          (c.mobileNumber || '').toLowerCase().includes(trimmedSearch)
        );
      });
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
  selectCustomer(customer: any): void {
    // Only set the name into the form as requested
    this.form.get('customerName')?.setValue(customer?.name || '');
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

  onPolicyNumberBlur(): void {
    if (this.isEditMode) {
      this.policyNumberWarning = '';
      return;
    }

    const control = this.form.get('policyNumber');
    const value = control?.value ? String(control.value).trim() : '';

    if (!value) {
      this.policyNumberWarning = '';
      return;
    }

    this.policyService.searchPolicies({ customerName: null, policyNumber: value, registrationNumber: null, mobileNumber: null }, 1, 10, true)
      .subscribe({
        next: (response) => {
          if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
            control?.setValue('');
            this.policyNumberWarning = 'Policy number already exists. Please enter a different policy number.';
          } else {
            this.policyNumberWarning = '';
          }
        },
        error: (error) => {
          console.warn('Policy number validation failed:', error);
          this.policyNumberWarning = '';
        }
      });
  }

  // Close dropdowns when clicking outside
  submit(): void {
    this.submitErrorMessage = '';

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
      
      // Helper function to format dates to ISO string (YYYY-MM-DD)
      const formatDateToISO = (dateValue: any): string | null => {
        if (!dateValue) return null;
        
        let date: Date;
        if (typeof dateValue === 'string') {
          date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
          date = dateValue;
        } else {
          return null;
        }
        
        if (isNaN(date.getTime())) return null;
        
        // Return ISO string (YYYY-MM-DD format)
        return date.toISOString().split('T')[0];
      };
      
      const policyPayload = {
        ...formData,
        // Ensure customerName is properly set to the selected value
        customerName: formData.customerName.trim(),
        // Ensure premiumSource is included
        premiumSource: formData.premiumSource || 'Net Premium',
        ncbAmount: this.form.get('ncbAmount')?.value || this.getNcbAmount().toFixed(2),
        // Ensure dates are in ISO string format
        periodFrom: formatDateToISO(formData.periodFrom),
        periodTo: formatDateToISO(formData.periodTo),
        policyDate: formatDateToISO(formData.policyDate)
      };

      // Map discount field to premiumDiscount expected by backend
      policyPayload.premiumDiscount = formData.discount != null ? Number(formData.discount) : 0;
      
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
            this.submitErrorMessage = response.message || 'Unable to save policy details. Please review the form and try again.';
          }
        },
        error: (error) => {
          console.error('Error saving policy:', error);
          this.submitErrorMessage = this.getReadableSubmissionError(error);
        }
      });
    } else {
      this.form.markAllAsTouched();
      alert('Please fill all required fields correctly.');
    }
  }

  private getReadableSubmissionError(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Unable to save policy details. Please review the form and try again.';
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
    // Ensure numeric premium and brokerage fields revert to 0 after reset
    this.form.patchValue({
      basicODPremium: 0,
      tpPremium: 0,
      ncb: 0,
      ncbAmount: 0,
      netPremium: 0,
      discount: 0,
      gstPercent: 0,
      gstAmount: 0,
      finalPremium: 0,
      totalIDV: 0,
      refBrokerageOn: 0,
      refBrokeragePercent: 0,
      refBrokerageAmount: 0,
      premiumSource: 'Net Premium'
    });
    this.documents = [];
  }

  /**
   * Extract policy details from document and auto-fill form
   * @param extractResponse The response from the extraction API
   */
  private clearFormFieldsBeforeAutoFill(): void {
    // Clear all editable premium and vehicle detail fields before auto-filling
    const fieldsToClear = [
      'basicODPremium', 'tpPremium', 'ncb', 'ncbAmount', 'netPremium', 'discount',
      'gstPercent', 'gstAmount', 'finalPremium', 'totalIDV',
      'refBrokerageOn', 'refBrokeragePercent', 'refBrokerageAmount',
      'make', 'model', 'registrationNumber',
      'policyNumber', 'companyName', 'productName', 'insuranceType',
      'insuranceBranch', 'policyType', 'periodFrom', 'periodTo', 'policyDate'
    ];

    const numericFields = new Set([
      'basicODPremium', 'tpPremium', 'ncb', 'ncbAmount', 'netPremium', 'discount',
      'gstPercent', 'gstAmount', 'finalPremium',
      'refBrokerageOn', 'refBrokeragePercent', 'refBrokerageAmount'
    ]);

    fieldsToClear.forEach(field => {
      const control = this.form.get(field);
      if (control) {
        if (numericFields.has(field)) {
          control.reset(0);
        } else {
          control.reset('');
        }
      }
    });
    
    console.log('Form fields cleared before auto-fill');
  }

  private getExtractedPolicyData(extractResponse: any): any {
    if (!extractResponse) {
      return null;
    }

    if (extractResponse.data) {
      return extractResponse.data;
    }

    if (extractResponse.rawJob?.extract_result) {
      return extractResponse.rawJob.extract_result;
    }

    if (extractResponse.rawJob?.result) {
      return extractResponse.rawJob.result;
    }

    if (extractResponse.rawJob) {
      return extractResponse.rawJob;
    }

    return extractResponse;
  }

  private autoFillPolicyDetailsFromExtraction(extractResponse: any): void {
    const extractedData = this.getExtractedPolicyData(extractResponse);
    if (!extractResponse || !extractResponse.success || !extractedData) {
      console.warn('Invalid extraction response or missing data');
      return;
    }

    // Clear fields before auto-filling
    this.clearFormFieldsBeforeAutoFill();

    // Map extracted fields to form fields
    const fieldsToUpdate: any = {};

    // Map simple text fields
    if (extractedData.policyNumber) fieldsToUpdate.policyNumber = extractedData.policyNumber;
    if (extractedData.companyName) fieldsToUpdate.companyName = extractedData.companyName;
    if (extractedData.insurance_company_name) fieldsToUpdate.companyName = extractedData.insurance_company_name;
    if (extractedData.productName) fieldsToUpdate.productName = extractedData.productName;
    if (extractedData.insuranceType) fieldsToUpdate.insuranceType = extractedData.insuranceType;
    if (extractedData.insuranceBranch) fieldsToUpdate.insuranceBranch = extractedData.insuranceBranch;
    if (extractedData.policyType) fieldsToUpdate.policyType = extractedData.policyType;
    if (extractedData.policy_type) fieldsToUpdate.policyType = extractedData.policy_type;
    if (extractedData.make) fieldsToUpdate.make = extractedData.make;
    if (extractedData.vehicle_make) fieldsToUpdate.make = extractedData.vehicle_make;
    if (extractedData.model) fieldsToUpdate.model = extractedData.model;
    if (extractedData.vehicle_model_variant_subtype) fieldsToUpdate.model = extractedData.vehicle_model_variant_subtype;
    if (extractedData.registrationNumber) fieldsToUpdate.registrationNumber = extractedData.registrationNumber;
    if (extractedData.vehicle_registration_number) fieldsToUpdate.registrationNumber = extractedData.vehicle_registration_number;

    // Map numeric fields
    if (extractedData.basicODPremium !== null && extractedData.basicODPremium !== undefined) {
      fieldsToUpdate.basicODPremium = extractedData.basicODPremium;
    }
    if (extractedData.tpPremium !== null && extractedData.tpPremium !== undefined) {
      fieldsToUpdate.tpPremium = extractedData.tpPremium;
    }
    if (extractedData.ncb !== null && extractedData.ncb !== undefined) {
      fieldsToUpdate.ncb = extractedData.ncb;
    }
    if (extractedData.ncbAmount !== null && extractedData.ncbAmount !== undefined) {
      fieldsToUpdate.ncbAmount = extractedData.ncbAmount;
    }
    if (extractedData.ncb_amount !== null && extractedData.ncb_amount !== undefined) {
      fieldsToUpdate.ncbAmount = extractedData.ncb_amount;
    }
    if (extractedData.netPremium !== null && extractedData.netPremium !== undefined) {
      fieldsToUpdate.netPremium = extractedData.netPremium;
    }
    if (extractedData.net_premium !== null && extractedData.net_premium !== undefined) {
      fieldsToUpdate.netPremium = extractedData.net_premium;
    }
    if (extractedData.gstPercent !== null && extractedData.gstPercent !== undefined) {
      fieldsToUpdate.gstPercent = extractedData.gstPercent;
    }
    if (extractedData.gstAmount !== null && extractedData.gstAmount !== undefined) {
      fieldsToUpdate.gstAmount = extractedData.gstAmount;
    }
    if (extractedData.gst !== null && extractedData.gst !== undefined) {
      fieldsToUpdate.gstAmount = extractedData.gst;
    }
    if (extractedData.finalPremium !== null && extractedData.finalPremium !== undefined) {
      fieldsToUpdate.finalPremium = extractedData.finalPremium;
    }
    if (extractedData.gross_premium !== null && extractedData.gross_premium !== undefined) {
      fieldsToUpdate.finalPremium = extractedData.gross_premium;
    }
    if (extractedData.totalIDV !== null && extractedData.totalIDV !== undefined) {
      fieldsToUpdate.totalIDV = extractedData.totalIDV;
    }
    if (extractedData.idv !== null && extractedData.idv !== undefined) {
      fieldsToUpdate.totalIDV = extractedData.idv;
    }
    if (extractedData.sum_insured !== null && extractedData.sum_insured !== undefined) {
      fieldsToUpdate.totalIDV = extractedData.sum_insured;
    }

    // Map premium discount if provided by extraction
    if (extractedData.premiumDiscount !== null && extractedData.premiumDiscount !== undefined) {
      // Convert strings to numbers safely
      const disc = typeof extractedData.premiumDiscount === 'string'
        ? parseFloat(extractedData.premiumDiscount.replace(/[^0-9.-]+/g, ''))
        : Number(extractedData.premiumDiscount);
      if (!isNaN(disc)) {
        fieldsToUpdate.discount = disc;
      }
    }

    // Map date fields (format to YYYY-MM-DD for date input)
    if (extractedData.periodFrom) {
      fieldsToUpdate.periodFrom = this.formatDateForInput(extractedData.periodFrom);
    }
    if (extractedData.periodTo) {
      fieldsToUpdate.periodTo = this.formatDateForInput(extractedData.periodTo);
      this.periodToAutoFilled = true;
    }
    if (extractedData.policyDate) {
      fieldsToUpdate.policyDate = this.formatDateForInput(extractedData.policyDate);
    }

    // // Map reference name if available
    // if (extractedData.referenceName) {
    //   fieldsToUpdate.referenceName = extractedData.referenceName;
    // }

    // Map customer details if available
    if (extractedData.policy_holder_name) {
      fieldsToUpdate.customerName = extractedData.policy_holder_name;
    }
    if (extractedData.name) {
      fieldsToUpdate.customerName = extractedData.name;
    }

    // Update form with extracted data
    console.log('Auto-filling form with extracted data:', fieldsToUpdate);
    this.form.patchValue(fieldsToUpdate);

    // Recalculate derived fields (GST and final premium will consider discount)
    this.calculateGstAndFinalPremium();
    this.calculateRefBrokerageAmount();

    console.log('Form auto-filled successfully from policy document');
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
      uploadDate: new Date().toLocaleString()
    };

    // Check if document type is POLICY and extract details (only for NEW policies, not when editing)
    if (documentType === 'POLICY' && !this.isEditMode) {
      this.policyExtractionLoading = true;
      this.documentUploadError = 'Extracting policy details from document...';
      this.policyDocumentExtractService.extractPolicyDetails(file).subscribe({
        next: (response) => {
          this.policyExtractionLoading = false;
          documentEntry.file = file;
          this.documents.push(documentEntry);
          this.documentForm.reset();
          fileInput.value = '';

          if (response && response.success) {
            // Auto-fill the form with extracted data
            this.autoFillPolicyDetailsFromExtraction(response);
            this.documentUploadError = '';
          } else {
            this.documentUploadError = 'Could not extract policy details. Document is uploaded and you can enter details manually.';
            console.warn('Extraction failed or returned no data:', response);
          }
        },
        error: (error) => {
          this.policyExtractionLoading = false;
          documentEntry.file = file;
          this.documents.push(documentEntry);
          this.documentForm.reset();
          fileInput.value = '';
          this.documentUploadError = 'Error extracting policy details. Document is uploaded and you can enter details manually.';
          console.error('Error extracting policy details:', error);
        }
      });
      return;
    }

    // For non-POLICY documents or POLICY documents in edit mode, proceed with normal upload
    if (this.isEditMode && this.policyId) {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('document', file);

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
    const basicODPremium = parseFloat(this.form.get('basicODPremium')?.value || 0);
    const tpPremium = parseFloat(this.form.get('tpPremium')?.value || 0);
    const ncbPercent = parseFloat(this.form.get('ncb')?.value || 0);

    // Calculate total of OD and TP premiums
    const totalPremium = basicODPremium + tpPremium;

    // Calculate NCB amount (NCB percentage of total premium)
    const ncbAmount = (totalPremium * ncbPercent) / 100;

    // Calculate Net Premium (Total - NCB Amount)
    const netPremium = totalPremium - ncbAmount;

    // Update the NCB Amount and Net Premium fields with calculated values
    this.form.patchValue(
      {
        ncbAmount: ncbAmount.toFixed(2),
        netPremium: netPremium.toFixed(2)
      },
      { emitEvent: false }
    );
  }

  /**
   * Get the calculated NCB amount for display
   * Returns the amount deducted based on NCB percentage
   */
  getNcbAmount(): number {
    const basicODPremium = parseFloat(this.form.get('basicODPremium')?.value || 0);
    const tpPremium = parseFloat(this.form.get('tpPremium')?.value || 0);
    const ncbPercent = parseFloat(this.form.get('ncb')?.value || 0);

    const totalPremium = basicODPremium + tpPremium;
    const ncbAmount = (totalPremium * ncbPercent) / 100;

    return ncbAmount;
  }

  /**
   * Get the calculated GST amount for display
   * Returns GST Amount calculated from Net Premium and GST %
   */
  getGstAmount(): number {
    const netPremium = parseFloat(this.form.get('netPremium')?.value || 0);
    const discount = parseFloat(this.form.get('discount')?.value || 0);
    const gstPercent = parseFloat(this.form.get('gstPercent')?.value || 0);

    const taxableBase = Math.max(0, netPremium - discount);
    const gstAmount = (taxableBase * gstPercent) / 100;

    return gstAmount;
  }

  /**
   * Calculate and update GST Amount and Final Premium
   * Formula: GST Amount = (Net Premium × GST%) / 100
   *          Final Premium = Net Premium + GST Amount
   */
  calculateGstAndFinalPremium(): void {
    const netPremium = parseFloat(this.form.get('netPremium')?.value || 0);
    const discount = parseFloat(this.form.get('discount')?.value || 0);
    const gstPercent = parseFloat(this.form.get('gstPercent')?.value || 0);

    const taxableBase = Math.max(0, netPremium - discount);

    // Calculate GST Amount based on taxable base after discount
    const gstAmount = (taxableBase * gstPercent) / 100;

    // Calculate Final Premium: (Net Premium - Discount) + GST Amount
    const finalPremium = taxableBase + gstAmount;

    // Update GST Amount and Final Premium fields
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
    const netPremium = parseFloat(this.form.get('netPremium')?.value || 0);
    const discount = parseFloat(this.form.get('discount')?.value || 0);
    const gstAmount = this.getGstAmount();

    const taxableBase = Math.max(0, netPremium - discount);
    const finalPremium = taxableBase + gstAmount;

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

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return null;
    }

    const nextYear = new Date(date);
    nextYear.setDate(nextYear.getDate() + 364);

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
  }
}





//create 1 more component as customermaster and add field like name , mobile number , emailid and add this is database table as well and create list as well of client and on click of add new redirect to add new customer and fetch customer name in policy details from this customer saved in database