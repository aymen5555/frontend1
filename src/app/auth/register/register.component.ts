import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder,
    FormGroup,
    Validators,
    AbstractControl,
    ValidationErrors,
    ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ComplexeService } from '../../services/complexe.service';
import { UserRole } from '../../models/auth.model';
import { Complexe } from '../../models/complexe.model';

function passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    const pwd = g.get('password')?.value;
    const conf = g.get('password_confirmation')?.value;
    return pwd === conf ? null : { mismatch: true };
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
    private fb = inject(FormBuilder);
    private auth = inject(AuthService);
    private router = inject(Router);
    private complexeSvc = inject(ComplexeService);

    selectedRole = signal<UserRole>('CLIENT');
    loading = signal(false);
    errorMessage = signal('');
    fieldErrors = signal<Record<string, string>>({});
    showPwd = signal(false);
    showPwd2 = signal(false);
    availableComplexes = signal<Complexe[]>([]);

    form: FormGroup = this.fb.group(
        {
            first_name: ['', [Validators.required, Validators.minLength(2)]],
            last_name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            password: ['', [Validators.required, Validators.minLength(8)]],
            password_confirmation: ['', Validators.required],
            complexe_id: [null as number | null],
        },
        { validators: passwordMatchValidator }
    );

    get firstName() { return this.form.get('first_name')!; }
    get lastName() { return this.form.get('last_name')!; }
    get email() { return this.form.get('email')!; }
    get password() { return this.form.get('password')!; }
    get password2() { return this.form.get('password_confirmation')!; }

    get passwordStrength(): number {
        const v = this.password.value || '';
        let s = 0;
        if (v.length >= 8) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        return s;
    }

    get strengthLabel(): string {
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        return labels[this.passwordStrength] || '';
    }

    get strengthClass(): string {
        const classes = ['', 'weak', 'fair', 'good', 'strong'];
        return classes[this.passwordStrength] || '';
    }

    get complexeId() {
        return this.form.get('complexe_id')!;
    }

    ngOnInit(): void {
        this.loadAvailableComplexes();
    }

    selectRole(role: UserRole): void {
        this.selectedRole.set(role);
        const complexeControl = this.form.get('complexe_id');

        if (!complexeControl) {
            return;
        }

        if (role === 'GERANT') {
            complexeControl.setValidators([Validators.required]);
        } else {
            complexeControl.clearValidators();
            complexeControl.setValue(null);
        }

        complexeControl.updateValueAndValidity();
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');
        this.fieldErrors.set({});

            // ensure role is sent in lowercase to match backend expectations
            const payload = {
                ...this.form.value,
                role: (this.selectedRole() as string).toLowerCase(),
            };

        this.auth.register(payload).subscribe({
            next: (res) => {
                this.loading.set(false);
                this.router.navigate(['/auth/verify-pending'], {
                    state: {
                        email: res.data.user.email,
                        verificationUrl: res.data.verification_url,
                    },
                });
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(this.readableError(err));
                if (err.errors) {
                    const flat: Record<string, string> = {};
                    for (const [field, msgs] of Object.entries(err.errors)) {
                        flat[field] = (msgs as string[])[0];
                    }
                    this.fieldErrors.set(flat);
                }
            },
        });
    }

    fieldError(field: string): string {
        return this.fieldErrors()[field] || '';
    }

    private loadAvailableComplexes(): void {
        this.complexeSvc.getUnassigned().subscribe({
            next: (data) => this.availableComplexes.set(data),
            error: () => this.availableComplexes.set([]),
        });
    }

    private readableError(err: { errors?: Record<string, string[]>; message?: string }): string {
        if (!err?.errors) return err.message || 'Registration failed.';

        const first = Object.values(err.errors)[0];
        if (Array.isArray(first) && first[0]) return first[0] as string;

        return err.message && err.message !== 'Validation failed.'
            ? err.message
            : 'Please fix the highlighted fields.';
    }
}
