import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PolicyListComponent } from './policy-list/policy-list.component';
import { PolicyPurchaseDetailsComponent } from './policy-purchase-details/policy-purchase-details.component';
import { MiscMasterComponent } from './misc-master/misc-master.component';
import { CustomerMasterComponent } from './customer-master/customer-master.component';
import { CustomerFormComponent } from './customer-master/customer-form.component';
import { ReferenceMasterComponent } from './reference-master/reference-master.component';
import { ReferenceFormComponent } from './reference-master/reference-form.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'policies', component: PolicyListComponent },
  { path: 'policies/new', component: PolicyPurchaseDetailsComponent },
  { path: 'policies/:id', component: PolicyPurchaseDetailsComponent },
  { path: 'policy-details', redirectTo: 'policies' },
  { path: 'misc-master', component: MiscMasterComponent },
  { path: 'customer-master', component: CustomerMasterComponent },
  { path: 'customer-master/add', component: CustomerFormComponent },
  { path: 'customer-master/edit/:id', component: CustomerFormComponent },
  { path: 'reference-master', component: ReferenceMasterComponent },
  { path: 'reference-master/add', component: ReferenceFormComponent },
  { path: 'reference-master/edit/:id', component: ReferenceFormComponent },
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
