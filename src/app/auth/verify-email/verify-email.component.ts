import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <section class="auth-page">
            <div class="auth-card">
                <div class="auth-logo"><i class="ti ti-mail-check"></i></div>
                <h1>Email verification</h1>

                @if (loading()) {
                    <p class="subtitle">Verifying your email…</p>
                    <i class="ti ti-loader-2 spin"></i>
                } @else if (success()) {
                    <p class="subtitle success">Your email is verified. Redirecting…</p>
                } @else {
                    <p class="subtitle error">{{ errorMessage() }}</p>
                    <a routerLink="/auth/login" class="btn-primary">Back to sign in</a>
                }
            </div>
        </section>
    `,
    styles: `
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #f5f5f0; }
        .auth-card { width: 100%; max-width: 420px; background: #fff; border-radius: 20px; border: 1px solid #e8e8e3; padding: 2.5rem; text-align: center; }
        .auth-logo { width: 52px; height: 52px; border-radius: 14px; background: #1D9E75; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; color: #fff; font-size: 26px; }
        h1 { font-size: 22px; font-weight: 500; margin: 0 0 0.5rem; }
        .subtitle { color: #666; margin-bottom: 1.5rem; }
        .success { color: #1D9E75; }
        .error { color: #c0392b; }
        .btn-primary { display: inline-block; padding: 0.75rem 1.5rem; background: #1D9E75; color: #fff; text-decoration: none; border-radius: 10px; }
        .spin { animation: spin 1s linear infinite; font-size: 28px; color: #1D9E75; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `,
})
export class VerifyEmailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);

    loading = signal(true);
    success = signal(false);
    errorMessage = signal('');

    ngOnInit(): void {
        const token = this.route.snapshot.queryParamMap.get('token');
        if (!token) {
            this.loading.set(false);
            this.errorMessage.set('Missing verification token.');
            return;
        }

        this.auth.verifyEmail(token).subscribe({
            next: () => {
                this.loading.set(false);
                this.success.set(true);
                setTimeout(() => this.auth.navigateToHome(), 1500);
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Verification failed.');
            },
        });
    }
}
