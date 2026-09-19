import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { OtpLoginComponent } from './otp-login/otp-login.component';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
import { PolicyListComponent } from './policy-list/policy-list.component';
import { PolicyPurchaseDetailsComponent } from './policy-purchase-details/policy-purchase-details.component';
import { MiscMasterComponent } from './misc-master/misc-master.component';
import { CustomerMasterComponent } from './customer-master/customer-master.component';
import { CustomerFormComponent } from './customer-master/customer-form.component';
import { ReferenceMasterComponent } from './reference-master/reference-master.component';
import { ReferenceFormComponent } from './reference-master/reference-form.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'otp-login', component: OtpLoginComponent },
  { path: 'customer-dashboard', component: CustomerDashboardComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'policies', component: PolicyListComponent, canActivate: [AuthGuard] },
  { path: 'policies/new', component: PolicyPurchaseDetailsComponent, canActivate: [AuthGuard] },
  { path: 'policies/:id', component: PolicyPurchaseDetailsComponent, canActivate: [AuthGuard] },
  { path: 'policy-details', redirectTo: 'policies' },
  { path: 'misc-master', component: MiscMasterComponent, canActivate: [AuthGuard] },
  { path: 'customer-master', component: CustomerMasterComponent, canActivate: [AuthGuard] },
  { path: 'customer-master/add', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'customer-master/edit/:id', component: CustomerFormComponent, canActivate: [AuthGuard] },
  { path: 'reference-master', component: ReferenceMasterComponent, canActivate: [AuthGuard] },
  { path: 'reference-master/add', component: ReferenceFormComponent, canActivate: [AuthGuard] },
  { path: 'reference-master/edit/:id', component: ReferenceFormComponent, canActivate: [AuthGuard] },
  { path: 'reports', loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule), canActivate: [AuthGuard] },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
