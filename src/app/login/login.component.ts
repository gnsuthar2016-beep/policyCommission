import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms 300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('800ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('shake', [
      transition(':enter', [
        animate('600ms', keyframes([
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-10px)', offset: 0.25 }),
          style({ transform: 'translateX(10px)', offset: 0.5 }),
          style({ transform: 'translateX(-10px)', offset: 0.75 }),
          style({ transform: 'translateX(0)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  selectedMode: 'admin' | 'customer' = 'admin';
  otpSent = false;
  generatedOtp = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      otp: ['']
    });
  }

  submit() {
    if (this.selectedMode === 'customer') {
      this.handleCustomerLogin();
      return;
    }

    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.login(this.form.value).subscribe({
        next: (response) => {
          if (response.success) {
            localStorage.setItem('user', JSON.stringify(response.data));
            localStorage.setItem('loginTime', new Date().toISOString());
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = response.message;
          }
          this.isLoading = false;
        },
        error: (error) => {
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 401) {
            this.errorMessage = 'Invalid email or password';
          } else if (error.status === 400) {
            this.errorMessage = 'Email and password are required';
          } else {
            this.errorMessage = 'An error occurred during login. Please try again.';
          }
          this.isLoading = false;
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  switchMode(mode: 'admin' | 'customer'): void {
    this.selectedMode = mode;
    this.errorMessage = '';
    this.successMessage = '';
    this.otpSent = false;
    this.generatedOtp = '';
    this.form.get('otp')?.setValue('');
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
          const otpFromResponse = (response as any)?.data?.otp;
          this.generatedOtp = otpFromResponse || '';
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

  handleCustomerLogin(): void {
    if (!this.otpSent) {
      this.sendOtp();
      return;
    }

    if (this.form.valid && this.form.get('otp')?.value) {
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
      this.errorMessage = 'Please enter the OTP received in your email.';
    }
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
