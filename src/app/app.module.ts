import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';
import { PolicyPurchaseDetailsComponent } from './policy-purchase-details/policy-purchase-details.component';
import { PolicyListComponent } from './policy-list/policy-list.component';
import { MiscMasterComponent } from './misc-master/misc-master.component';
import { CustomerMasterComponent } from './customer-master/customer-master.component';
import { ReferenceMasterComponent } from './reference-master/reference-master.component';
import { ReducePipe } from './pipes/reduce.pipe';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    DashboardComponent,
    ChangePasswordComponent,
    HeaderComponent,
    PolicyPurchaseDetailsComponent,
    PolicyListComponent,
    MiscMasterComponent,
    CustomerMasterComponent,
    ReferenceMasterComponent,
    ReducePipe
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
