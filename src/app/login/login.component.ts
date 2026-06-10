import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit() {
    if (this.form.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.login(this.form.value).subscribe({
        next: (response) => {
          if (response.success) {
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(response.data));
            // Store login time
            localStorage.setItem('loginTime', new Date().toISOString());
            // Navigate to dashboard or home page
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

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
