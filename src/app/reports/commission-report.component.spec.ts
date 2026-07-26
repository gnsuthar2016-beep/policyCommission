import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommissionReportComponent } from './commission-report.component';
import { PolicyService } from '../services/policy.service';

describe('CommissionReportComponent', () => {
  let component: CommissionReportComponent;
  let fixture: ComponentFixture<CommissionReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommissionReportComponent],
      imports: [FormsModule],
      providers: [{ provide: PolicyService, useValue: { getAllReferenceNames: () => ({ subscribe: () => {} }) } }]
    }).compileComponents();

    fixture = TestBed.createComponent(CommissionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should build a pdf export filename using the selected date range', () => {
    component.startDate = '2026-07-01';
    component.endDate = '2026-07-31';

    expect(component.getExportFileName()).toBe('commission-report-2026-07-01-to-2026-07-31.pdf');
  });
});
