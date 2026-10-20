import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';

/** Adds the admin token to API calls and logs out when the server no longer accepts it. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AdminAuthService);
  const token = auth.token();
  const authorized =
    token && request.url.startsWith('/api/')
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (token && error instanceof HttpErrorResponse && error.status === 403) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
