import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CustomerDashboardComponent } from './customer-dashboard.component';
import { PolicyService } from '../services/policy.service';

describe('CustomerDashboardComponent', () => {
  let component: CustomerDashboardComponent;
  let fixture: ComponentFixture<CustomerDashboardComponent>;
  let policyService: jasmine.SpyObj<PolicyService>;

  beforeEach(async () => {
    const policySpy = jasmine.createSpyObj('PolicyService', ['getCustomerDashboard']);

    await TestBed.configureTestingModule({
      declarations: [CustomerDashboardComponent],
      providers: [
        { provide: PolicyService, useValue: policySpy },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();

    policyService = TestBed.inject(PolicyService) as jasmine.SpyObj<PolicyService>;
    policyService.getCustomerDashboard.and.returnValue(of({
      success: true,
      data: {
        customer: { name: 'Alice', emailId: 'alice@example.com' },
        policies: [],
        documents: []
      }
    }));

    localStorage.setItem('user', JSON.stringify({ name: 'Alice', email: 'alice@example.com' }));

    fixture = TestBed.createComponent(CustomerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('user');
  });

  it('loads dashboard data for the logged in customer', () => {
    expect(component.customerEmail).toBe('alice@example.com');
    expect(policyService.getCustomerDashboard).toHaveBeenCalledWith('alice@example.com');
  });
});
