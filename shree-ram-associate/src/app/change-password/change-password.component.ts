import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder, public router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required]
    });
  }

  submit() {
    if (this.form.valid && this.form.value.newPassword === this.form.value.confirm) {
      alert('Password changed (demo)');
      this.router.navigate(['']);
    } else {
      this.form.markAllAsTouched();
      if (this.form.value.newPassword !== this.form.value.confirm) {
        alert('New password and confirm do not match');
      }
    }
  }
}
