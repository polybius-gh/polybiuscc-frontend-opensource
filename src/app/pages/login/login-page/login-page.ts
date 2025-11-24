import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { AuthService } from '../../../services/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckbox,
    ReactiveFormsModule,
    MatIconModule
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  signInForm!: FormGroup;

  authError: string | null = null;

  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {}

    ngOnInit(): void {
      //console.log('loading login page');
    // Create the form
    this.signInForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      rememberMe: new FormControl(false), // default unchecked
    });

    // Clear auth error when user types again
    this.signInForm.valueChanges.subscribe(() => {
      if (this.authError) {
        this.authError = null;
      }
    });

  // Prefill username if previously saved
  const savedUserName = localStorage.getItem('savedUserName');
  if (savedUserName) {
    this.signInForm.patchValue({
      username: savedUserName,
      rememberMe: true
    });
  }
  }

    // Helper getters for template
  get username() {
    return this.signInForm.get('username');
  }

  get password() {
    return this.signInForm.get('password');
  }

  // signIn(): void {
  //   if (this.signInForm.invalid) {
  //     return;
  //   }

  //   this.signInForm.disable();
  //   this.authError = null;

  //   const { username, password, rememberMe } = this.signInForm.value;
  //   console.log('login sign-in processing...')
  //   this._authService.signIn({ username, password }).subscribe(
  //     (res) => {
  //       // Decide where to store token
  //       if (rememberMe) {
  //         localStorage.setItem('savedUserName', username);
  //       } else {
  //         localStorage.removeItem('savedUserName');
  //       }
  //       console.log('navigating by URL')
  //       this._router.navigateByUrl(
  //         this._activatedRoute.snapshot.queryParamMap.get('redirectURL') ||
  //           '/dashboard'
  //       );
  //     },
  //     (err) => {
  //       this.signInForm.enable();
  //       this.authError = 'Invalid username or password';
  //     }
  //   );
  // }

  async signIn(): Promise<void> {
  if (this.signInForm.invalid) {
    return;
  }

  this.signInForm.disable();
  this.authError = null;

  const { username, password, rememberMe } = this.signInForm.value;

  try {
    //console.log('login sign-in processing...');

    // 1️⃣ Perform sign-in
    const res = await firstValueFrom(this._authService.signIn({ username, password }));
    //console.log('authSignIn res:', res);
    // 2️⃣ Load user session after sign-in
    //await this._userSessionService.loadUserSession(res.sessionID);

    // 3️⃣ Save username if "remember me"
    if (rememberMe) {
      localStorage.setItem('savedUserName', username);
    } else {
      localStorage.removeItem('savedUserName');
    }

    //console.log('navigating by URL');
    this._router.navigateByUrl(
      this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/dashboard'
    );
  } catch (err) {
    console.error('login or session load failed', err);
    this.signInForm.enable();
    this.authError = 'Invalid username or password';
  }
}

}
