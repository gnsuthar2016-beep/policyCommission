import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { CommissionReportComponent } from './commission-report.component';

@NgModule({
  declarations: [ReportsComponent, CommissionReportComponent],
  imports: [CommonModule, FormsModule, ReportsRoutingModule]
})
export class ReportsModule {}
