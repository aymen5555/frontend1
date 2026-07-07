import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const laravelErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      try {
        // Allow callers to opt-out of the global error toast by setting
        // the `X-Skip-Error-Toast` header to `1` on the request.
        if (req.headers.get('X-Skip-Error-Toast') === '1') {
          return throwError(() => err);
        }

        const body = err?.error ?? {};
        // Laravel validation errors: { errors: { field: [messages] } }
        if (err.status === 422 && body.errors) {
          const firstFieldErrors = Object.values(body.errors)[0] as any;
          const firstMessage = Array.isArray(firstFieldErrors) ? firstFieldErrors[0] : String(firstFieldErrors);
          toast.error(firstMessage || 'Données invalides.');
        } else if (body?.message) {
          toast.error(body.message);
        }
      } catch (e) {
        // no-op fallback
      }

      return throwError(() => err);
    })
  );
};
