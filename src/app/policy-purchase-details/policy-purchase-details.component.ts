import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PolicyService } from '../services/policy.service';
import { MiscMasterService } from '../services/misc-master.service';
import { CustomerService } from '../services/customer.service';
import { ReferenceService } from '../services/reference.service';

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
  renewalOptions: any[] = [];
  referenceNames: any[] = [];
  companyNames: any[] = [];
  insuranceTypes: any[] = [];
  productNames: any[] = [];
  vehicleMakes: any[] = [];
  vehicleModels: any[] = [];
  registrationNumbers: any[] = [];
  documentTypes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private policyService: PolicyService,
    private miscMasterService: MiscMasterService,
    private customerService: CustomerService,
    private referenceService: ReferenceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializeDocumentForm();
    this.initializeAddCustomerForm();
    this.initializeAddReferenceForm();
    
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
          console.log('Loaded Customer Names:', this.customerNames);
        } else {
          this.customerNames = [];
        }
      },
      error: (error) => {
        console.warn('Error loading customer names:', error);
        this.customerNames = [];
      }
    });
  }

  loadReferenceNames(): void {
    this.referenceService.getAllReferences().subscribe({
      next: (response) => {
        if (response.success && response.data && Array.isArray(response.data)) {
          // Extract just the names from references
          this.referenceNames = response.data.map((reference: any) => reference.name);
        } else {
          this.referenceNames = [];
        }
      },
      error: (error) => {
        console.warn('Error loading reference names:', error);
        this.referenceNames = [];
      }
    });
  }

  loadMiscMasterValues(): void {
    // Mapping of dropdown property names to Misc Master type names
    const dropdownTypeMap = [
      { property: 'policyTypes', type: 'Policy Type' },
      { property: 'renewalOptions', type: 'Renewal' },
      { property: 'companyNames', type: 'Company Name' },
      { property: 'insuranceTypes', type: 'Insurance Type' },
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
            policyDate: this.formatDateForInput(policy.policyDate)
          };
          
          this.form.patchValue(formattedPolicy);
          
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
      emailId: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', []],
      remark: ['', []]
    });
  }

  initializeAddReferenceForm(): void {
    this.addReferenceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      alternativeMobileNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      emailId: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', []],
      remark: ['', []]
    });
  }

  initializeForm(): void {
    this.form = this.fb.group({
      customerName: ['', Validators.required],
      policyType: ['', Validators.required],
      renewal: ['', Validators.required],
      //insuredName: ['', [Validators.required, Validators.minLength(3)]],
      policyNumber: ['', [Validators.required, Validators.minLength(5)]],
      referenceName: ['', Validators.required],
      companyName: ['', Validators.required],
      insuranceType: ['', Validators.required],
      productName: ['', Validators.required],
      periodFrom: ['', Validators.required],
      periodTo: ['', Validators.required],
      policyDate: [''],
      basicODPremium: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      tpPremium: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      ncb: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      netPremium: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      gstPercent: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      gstAmount: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      finalPremium: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      refBrokerageOn: ['', [Validators.required,Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      refBrokeragePercent: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      refBrokerageAmount: ['', [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      totalIDV: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      make: ['', Validators.required],
      model: ['', Validators.required],
      registrationNumber: ['', Validators.required]
    });
  }

  onCustomerChange(event: any): void {
    const selectedValue = event.target.value;
    console.log('Customer selected from dropdown:', selectedValue);
    this.form.get('customerName')?.setValue(selectedValue);
  }

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
        // Ensure dates are in ISO string format
        periodFrom: formatDateToISO(formData.periodFrom),
        periodTo: formatDateToISO(formData.periodTo),
        policyDate: formatDateToISO(formData.policyDate)
      };
      
      console.log('Complete Payload Being Sent to API:', policyPayload);

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
      renewal: 'Renewal',
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
    return this.form.get('netPremium')?.value || 0;
  }

  /**
   * Calculate and update Ref. Brokerage Amount
   * Formula: Ref. Brokerage Amount = Ref. Brokerage On (Net Premium) × Ref Brokerage% / 100
   */
  calculateRefBrokerageAmount(): void {
    const netPremium = this.form.get('netPremium')?.value || 0;
    const refBrokeragePercent = this.form.get('refBrokeragePercent')?.value || 0;

    // Calculate Ref. Brokerage Amount
    const refBrokerageAmount = (parseFloat(netPremium) * parseFloat(refBrokeragePercent)) / 100;

// Update the Ref. Brokerage Amount field (for storing if needed)
    this.form.patchValue(
      { refBrokerageOn: parseFloat(netPremium).toFixed(2) },
      { emitEvent: false }
    );

    // Update the Ref. Brokerage Amount field (for storing if needed)
    this.form.patchValue(
      { refBrokerageAmount: refBrokerageAmount.toFixed(2) },
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

    // Watch for changes in GST % to update GST Amount and Final Premium
    this.form.get('gstPercent')?.valueChanges.subscribe(() => {
      this.calculateGstAndFinalPremium();
    });

    // Watch for changes in Ref Brokerage % to update Ref. Brokerage Amount
    this.form.get('refBrokeragePercent')?.valueChanges.subscribe(() => {
      this.calculateRefBrokerageAmount();
    });
  }
}





//create 1 more component as customermaster and add field like name , mobile number , emailid and add this is database table as well and create list as well of client and on click of add new redirect to add new customer and fetch customer name in policy details from this customer saved in database