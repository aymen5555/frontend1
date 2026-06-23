import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    ResendVerificationResponse,
    User,
} from '../models/auth.model';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'ps_token';
const USER_KEY = 'ps_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly api = `${environment.apiUrl}/auth`;

    // Reactive state via signals
    private readonly _user = signal<User | null>(this.loadUser());
    private readonly _token = signal<string | null>(this.loadToken());

    readonly user = this._user.asReadonly();
    readonly token = this._token.asReadonly();
    readonly isLoggedIn = computed(() => !!this._token());
    // `isSuperAdmin` is strict (only explicit SUPER_ADMIN)
    readonly isSuperAdmin = computed(() => this._user()?.role === 'SUPER_ADMIN');
    // `isAdmin` is a backward-compatible alias: treats legacy 'ADMIN' as admin as well
    readonly isAdmin = computed(() => {
        const role = this._user()?.role;
        return role === 'SUPER_ADMIN' || role === 'ADMIN';
    });
    readonly isGerant = computed(() => this._user()?.role === 'GERANT');
    readonly isGerantOrAdmin = computed(() => {
        const role = this._user()?.role;
        return role === 'GERANT' || role === 'SUPER_ADMIN' || role === 'ADMIN';
    });
    readonly isClient = computed(() => this._user()?.role === 'CLIENT');

    constructor(private readonly http: HttpClient, private readonly router: Router) { }

    // ── Register ─────────────────────────────────────
    register(payload: RegisterRequest): Observable<RegisterResponse> {
        return this.http.post<RegisterResponse>(`${this.api}/register`, payload).pipe(
            catchError(this.handleError)
        );
    }

    verifyEmail(token: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.api}/verify-email`, { token }).pipe(
            tap((res) => this.persist(res)),
            catchError(this.handleError)
        );
    }

    resendVerification(email: string): Observable<ResendVerificationResponse> {
        return this.http.post<ResendVerificationResponse>(
            `${this.api}/resend-verification`,
            { email }
        ).pipe(catchError(this.handleError));
    }

    // ── Login ─────────────────────────────────────────
    login(payload: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.api}/login`, payload).pipe(
            tap((res) => this.persist(res)),
            catchError(this.handleError)
        );
    }

    // ── Logout ────────────────────────────────────────
    logout(): void {
        this.http.post(`${this.api}/logout`, {}).subscribe({
            complete: () => this.clearSession(),
            error: () => this.clearSession(),
        });
    }

    /** Force logout without HTTP call (used by JWT interceptor when refresh fails) */
    forceLogout(): void {
        this.clearSession();
    }

    // ── Refresh token ─────────────────────────────────
    refreshToken(): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.api}/refresh`, {}).pipe(
            tap((res) => {
                const token = res.data.token;
                if (!token) return;
                localStorage.setItem(TOKEN_KEY, token);
                this._token.set(token);
            }),
            catchError((err) => {
                this.clearSession();
                return throwError(() => err);
            })
        );
    }

    // ── Helpers ──────────────────────────────────────
    getToken(): string | null {
        return this._token();
    }

    currentUser(): User | null {
        return this._user();
    }

    navigateToHome(): void {
        if (this.isSuperAdmin() || this.isClient()) {
            this.router.navigate(['/home']);
            return;
        }

        if (this.isGerant() || this.isAdmin()) {
            this.router.navigate(['/admin/dashboard']);
            return;
        }

        this.router.navigate(['/home']);
    }

    private persist(res: AuthResponse): void {
        if (!res.data.token) return;
        const normalizedUser = this.normalizeUser(res.data.user);
        localStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
        this._token.set(res.data.token);
        this._user.set(normalizedUser);
    }

    private clearSession(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this._token.set(null);
        this._user.set(null);
        this.router.navigate(['/auth/login']);
    }

    private loadToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    private loadUser(): User | null {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;

        try {
            const user = JSON.parse(raw) as User;
            return this.normalizeUser(user);
        } catch {
            localStorage.removeItem(USER_KEY);
            return null;
        }
    }

    private normalizeUser(user: User): User {
        return {
            ...user,
            role: this.normalizeRole(user.role),
        };
    }

    private normalizeRole(role: string | undefined | null): User['role'] {
        if (!role) return 'CLIENT';

        switch (role.toLowerCase()) {
            case 'client':
                return 'CLIENT';
            case 'super_admin':
                return 'SUPER_ADMIN';
            case 'gerant':
                return 'GERANT';
            case 'admin':
                return 'ADMIN';
            default:
                return role as User['role'];
        }
    }

    private handleError(err: unknown): Observable<never> {
        const defaultMessage = 'An unexpected error occurred. Please try again.';
        if (typeof err === 'object' && err !== null) {
            const e = err as Record<string, unknown>;
            const inner = e['error'] as Record<string, unknown> | undefined;
        const message = inner && typeof inner['message'] === 'string' ? inner['message'] : defaultMessage;
        return throwError(() => ({ ...inner, message }));
        }

        return throwError(() => ({ message: defaultMessage }));
    }
}
