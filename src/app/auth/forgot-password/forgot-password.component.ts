import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <div class="max-w-md mx-auto min-h-screen flex items-center justify-center px-4">
            <div class="w-full bg-white rounded-lg shadow-md p-8">
                <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">Mot de passe oublié</h1>

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
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            [class.border-red-500]="email?.invalid && email?.touched"
                            placeholder="votre@email.com"
                        />
                        @if (email?.invalid && email?.touched) {
                            <p class="text-red-500 text-sm mt-1">Email invalide</p>
                        }
                    </div>

                    <button
                        type="submit"
                        [disabled]="loading() || form.invalid"
                        class="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {{ loading() ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation' }}
                    </button>
                </form>

                <div class="mt-6 text-center">
                    <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-800 text-sm">Retour à la connexion</a>
                </div>
            </div>
        </div>
    `,
})
export class ForgotPasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    form: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
    });

    loading = signal(false);
    errorMessage = signal('');
    success = signal(false);
    successMessage = signal('Email envoyé, vérifiez votre boîte mail');

    get email() { return this.form.get('email'); }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');

        this.auth.forgotPassword(this.form.value.email).subscribe({
            next: () => {
                this.loading.set(false);
                this.success.set(true);
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Erreur lors de l\'envoi.');
            },
        });
    }
}