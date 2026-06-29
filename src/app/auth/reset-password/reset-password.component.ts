import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <div class="max-w-md mx-auto min-h-screen flex items-center justify-center px-4">
            <div class="w-full bg-white rounded-lg shadow-md p-8">
                <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">Réinitialiser le mot de passe</h1>

                @if (success()) {
                    <div class="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-4">
                        {{ successMessage() }}
                    </div>
                }

                @if (errorMessage()) {
                    <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
                        {{ errorMessage() }}
                    </div>
                }

                <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="email"
                            type="email"
                            formControlName="email"
                            readonly
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                        <input
                            id="password"
                            type="password"
                            formControlName="password"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            [class.border-red-500]="password?.invalid && password?.touched"
                            placeholder="••••••••"
                        />
                        @if (password?.invalid && password?.touched) {
                            <p class="text-red-500 text-sm mt-1">
                                Le mot de passe doit contenir au moins 8 caractères
                            </p>
                        }
                    </div>

                    <div>
                        <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                        <input
                            id="password_confirmation"
                            type="password"
                            formControlName="password_confirmation"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            [class.border-red-500]="passwordConfirmation?.invalid && passwordConfirmation?.touched"
                            placeholder="••••••••"
                        />
                        @if (form.hasError('passwordMismatch') && passwordConfirmation?.touched) {
                            <p class="text-red-500 text-sm mt-1">Les mots de passe ne correspondent pas</p>
                        }
                    </div>

                    <button
                        type="submit"
                        [disabled]="loading() || form.invalid"
                        class="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {{ loading() ? 'Réinitialisation...' : 'Réinitialiser le mot de passe' }}
                    </button>
                </form>

                <div class="mt-6 text-center">
                    <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-800 text-sm">Retour à la connexion</a>
                </div>
            </div>
        </div>
    `,
})
export class ResetPasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    form: FormGroup = this.fb.group(
        {
            token: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            password_confirmation: ['', Validators.required],
        },
        { validators: this.passwordMatchValidator }
    );

    loading = signal(false);
    errorMessage = signal('');
    success = signal(false);
    successMessage = signal('Mot de passe réinitialisé avec succès. Redirection...');

    get token() { return this.form.get('token'); }
    get email() { return this.form.get('email'); }
    get password() { return this.form.get('password'); }
    get passwordConfirmation() { return this.form.get('password_confirmation'); }

    constructor() {
        // Read token and email from URL query params
        const params = this.route.snapshot.queryParams;
        if (params['token']) {
            this.form.patchValue({ token: params['token'] });
        }
        if (params['email']) {
            this.form.patchValue({ email: params['email'] });
        }
        if (params['email']) {
            this.form.get('email')?.disable();
        }
    }

    passwordMatchValidator(group: FormGroup) {
        const password = group.get('password')?.value;
        const confirm = group.get('password_confirmation')?.value;
        return password === confirm ? null : { passwordMismatch: true };
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');

        const payload = {
            token: this.form.value.token,
            email: this.form.getRawValue().email,
            password: this.form.value.password,
            password_confirmation: this.form.value.password_confirmation,
        };

        this.auth.resetPassword(payload).subscribe({
            next: () => {
                this.loading.set(false);
                this.success.set(true);
                setTimeout(() => {
                    this.router.navigate(['/auth/login'], {
                        queryParams: { reset: 'success' },
                    });
                }, 2000);
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Erreur lors de la réinitialisation.');
            },
        });
    }
}