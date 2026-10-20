import { HttpErrorResponse } from '@angular/common/http';

/** A readable message for a failed request. */
export function httpErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof HttpErrorResponse) {
    const message: unknown = error.error?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
    if (error.status === 0) {
      return 'The server is not reachable';
    }
  }
  return fallback;
}
