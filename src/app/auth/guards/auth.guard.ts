import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Protects any route that requires a logged-in user
export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
        if (route.data?.['redirectAdmin'] && (auth.isGerant() || (auth.isAdmin() && !auth.isSuperAdmin()))) {
            router.navigate(['/admin/dashboard']);
            return false;
        }
        return true;
    }

    router.navigate(['/auth/login'], { queryParams: { redirect: state.url } });
    return false;
};

// Protects GERANT routes (admin dashboard)
export const gerantGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Allow GERANT or admin-level users (legacy ADMIN or SUPER_ADMIN)
    if (auth.isLoggedIn()) {
        if (auth.isGerant() || auth.isAdmin()) return true;
        router.navigate(['/home']);
    } else {
        router.navigate(['/auth/login'], { queryParams: { redirect: state.url } });
    }
    return false;
};

// Protects SUPER_ADMIN routes
export const superAdminGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
        if (auth.isSuperAdmin()) return true;
        router.navigate(['/home']);
    } else {
        router.navigate(['/auth/login'], { queryParams: { redirect: state.url } });
    }
    return false;
};

// Redirects already-logged-in users away from /auth pages to unified home
export const guestGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) return true;

    if (auth.isSuperAdmin()) {
        router.navigate(['/super-admin/dashboard']);
    } else if (auth.isGerant()) {
        router.navigate(['/admin/dashboard']);
    } else {
        router.navigate(['/home']);
    }
    return false;
};
