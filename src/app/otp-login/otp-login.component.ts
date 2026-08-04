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
    const emailControl = this.form.get('email');
    const emailValue = String(emailControl?.value || '').trim();
    emailControl?.setValue(emailValue);

    if (emailControl?.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.sendOtp({ email: emailValue }).subscribe({
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
    const emailControl = this.form.get('email');
    const otpControl = this.form.get('otp');
    const emailValue = String(emailControl?.value || '').trim();
    const otpValue = String(otpControl?.value || '').trim();
    emailControl?.setValue(emailValue);
    otpControl?.setValue(otpValue);

    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.verifyOtp({
        email: emailValue,
        otp: otpValue
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
      this.errorMessage = 'Please enter a valid email and 6-digit OTP.';
    }
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}
