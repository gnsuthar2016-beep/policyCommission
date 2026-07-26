import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-otp-login',
  templateUrl: './otp-login.component.html',
  styleUrls: ['./otp-login.component.css']
})
export class OtpLoginComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  otpSent = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  sendOtp(): void {
    if (this.form.get('email')?.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.sendOtp({ email: this.form.value.email }).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.otpSent = true;
          this.successMessage = response.message || 'OTP sent successfully. Please check your inbox.';
          this.form.get('otp')?.setValue('');
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Unable to send OTP right now.';
        }
      });
    } else {
      this.form.get('email')?.markAsTouched();
    }
  }

  verifyOtp(): void {
    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.verifyOtp({
        email: this.form.value.email,
        otp: this.form.value.otp
      }).subscribe({
        next: (response) => {
          if (response.success) {
            localStorage.setItem('user', JSON.stringify(response.data));
            localStorage.setItem('loginTime', new Date().toISOString());
            this.router.navigate(['/customer-dashboard']);
          } else {
            this.errorMessage = response.message || 'OTP verification failed.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Invalid OTP. Please try again.';
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}
