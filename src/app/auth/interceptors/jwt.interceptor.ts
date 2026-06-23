import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Attach Bearer token if available
    const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            const isAuthRoute =
                req.url.includes('/auth/login') ||
                req.url.includes('/auth/register') ||
                req.url.includes('/auth/refresh');

            if (error.status !== 401 || isAuthRoute) {
                return throwError(() => error);
            }

            if (isRefreshing) {
                // Another refresh is in flight — wait for it then retry
                return refreshTokenSubject.pipe(
                    filter((t): t is string => t !== null),
                    take(1),
                    switchMap((newToken) =>
                        next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))
                    )
                );
            }

            isRefreshing = true;
            refreshTokenSubject.next(null); // block queued requests

            return authService.refreshToken().pipe(
                switchMap((res) => {
                    isRefreshing = false;
                    const newToken = res.data.token;
                    if (!newToken) {
                        authService.forceLogout();
                        return throwError(() => new Error('Token refresh failed'));
                    }
                    refreshTokenSubject.next(newToken);
                    return next(
                        req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
                    );
                }),
                catchError((refreshErr) => {
                    isRefreshing = false;
                    refreshTokenSubject.next(null);
                    // Refresh failed (401) → force logout so user goes to login page
                    authService.forceLogout();
                    return throwError(() => refreshErr);
                })
            );
        })
    );
};