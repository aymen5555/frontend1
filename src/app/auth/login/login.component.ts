import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

const VERIFY_PENDING = '/auth/verify-pending';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    form: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
    });

    loading = signal(false);
    errorMessage = signal('');
    showPassword = signal(false);

    get email() { return this.form.get('email'); }
    get password() { return this.form.get('password'); }

    togglePassword(): void {
        this.showPassword.update((v) => !v);
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');

        this.auth.login(this.form.value).subscribe({
            next: () => {
                this.loading.set(false);
                const redirectUrl = this.route.snapshot.queryParams['redirect'];
                if (redirectUrl) {
                    this.router.navigateByUrl(redirectUrl);
                    return;
                }
                this.auth.navigateToHome();
            },
            error: (err) => {
                this.loading.set(false);
                if (err.code === 'EMAIL_NOT_VERIFIED') {
                    this.router.navigate([VERIFY_PENDING], {
                        state: { email: this.form.value.email },
                    });
                    return;
                }
                this.errorMessage.set(err.message || 'Login failed.');
            },
        });
    }
}
