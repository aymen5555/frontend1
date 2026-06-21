import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as Array<string>;
  const user = auth.currentUser();

  if (!auth.isLoggedIn() || !user) {
    router.navigate(['/auth/login'], { queryParams: { redirect: state.url } });
    return false;
  }

  const userRole = user.role?.toUpperCase();

  if (allowedRoles && allowedRoles.map(r => r.toUpperCase()).includes(userRole)) {
    return true;
  }

  // Redirect to home if they don't have access
  router.navigate(['/home']);
  return false;
};
