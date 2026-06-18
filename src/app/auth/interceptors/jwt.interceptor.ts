import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';

let isRefreshing = false;

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
            // 401 on a non-auth endpoint → try refresh once, prevent concurrent refreshes
            const isAuthRoute = req.url.includes('/auth/login') ||
                req.url.includes('/auth/register') ||
                req.url.includes('/auth/refresh');

            if (error.status === 401 && !isAuthRoute && !isRefreshing) {
                isRefreshing = true;
                return authService.refreshToken().pipe(
                    switchMap((res) => {
                        isRefreshing = false;
                        const retried = req.clone({
                            setHeaders: { Authorization: `Bearer ${res.data.token}` },
                        });
                        return next(retried);
                    }),
                    catchError((refreshErr) => {
                        isRefreshing = false;
                        return throwError(() => refreshErr);
                    })
                );
            }

            return throwError(() => error);
        })
    );
};