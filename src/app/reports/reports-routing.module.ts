import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { CommissionReportComponent } from './commission-report.component';

const routes: Routes = [
  { path: '', component: ReportsComponent },
  { path: 'commission', component: CommissionReportComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule {}
