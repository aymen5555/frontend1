import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-verify-pending',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <section class="auth-page">
            <div class="auth-card">
                <div class="auth-logo"><i class="ti ti-mail"></i></div>
                <h1>Email verification</h1>
                <p class="subtitle">
                    @if (verificationUrl()) {
                        Email delivery is in local log mode. Use this verification link for <strong>{{ email }}</strong>.
                    } @else {
                        We sent a verification link to <strong>{{ email }}</strong>.
                        Click the link in the email to activate your account.
                    }
                </p>
                <p class="hint">Verification links start with <code>psv_</code>. They are not login tokens.</p>

                @if (verificationUrl()) {
                    <a class="btn-primary" [href]="verificationUrl()">Verify now</a>
                }

                @if (resent()) {
                    <p class="success">A new verification link is ready.</p>
                }
                @if (errorMessage()) {
                    <p class="error">{{ errorMessage() }}</p>
                }

                <button type="button" class="btn-secondary" [disabled]="resending()" (click)="resend()">
                    @if (resending()) { Sending... } @else { Resend verification }
                </button>

                <p class="footer-link">
                    <a routerLink="/auth/login">Back to sign in</a>
                </p>
            </div>
        </section>
    `,
    styles: `
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: #f5f5f0; }
        .auth-card { width: 100%; max-width: 480px; background: #fff; border-radius: 20px; border: 1px solid #e8e8e3; padding: 2.5rem; text-align: center; }
        .auth-logo { width: 52px; height: 52px; border-radius: 14px; background: #1D9E75; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; color: #fff; font-size: 26px; }
        h1 { font-size: 22px; font-weight: 500; margin: 0 0 0.5rem; }
        .subtitle { color: #444; margin-bottom: 1rem; line-height: 1.5; }
        .hint { font-size: 13px; color: #888; margin-bottom: 1.5rem; }
        code { background: #f0f0eb; padding: 2px 6px; border-radius: 4px; }
        .btn-primary { display: block; width: 100%; padding: 0.75rem; background: #1D9E75; color: #fff; border-radius: 10px; text-decoration: none; margin-bottom: 0.75rem; box-sizing: border-box; }
        .btn-secondary { width: 100%; padding: 0.75rem; border: 1.5px solid #1D9E75; background: #fff; color: #1D9E75; border-radius: 10px; cursor: pointer; font-size: 15px; }
        .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
        .success { color: #1D9E75; margin-bottom: 1rem; }
        .error { color: #c0392b; margin-bottom: 1rem; }
        .footer-link { margin-top: 1.5rem; font-size: 14px; }
        .footer-link a { color: #1D9E75; }
    `,
})
export class VerifyPendingComponent {
    private auth = inject(AuthService);

    email = history.state?.['email'] ?? 'your email';
    verificationUrl = signal(history.state?.['verificationUrl'] ?? '');
    resending = signal(false);
    resent = signal(false);
    errorMessage = signal('');

    resend(): void {
        if (!this.email || this.email === 'your email') return;
        this.resending.set(true);
        this.errorMessage.set('');
        this.auth.resendVerification(this.email).subscribe({
            next: (res) => {
                this.resending.set(false);
                this.resent.set(true);
                this.verificationUrl.set(res.data?.verification_url ?? '');
            },
            error: (err) => {
                this.resending.set(false);
                this.errorMessage.set(err.message || 'Could not resend verification.');
            },
        });
    }
}
