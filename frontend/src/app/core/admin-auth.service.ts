import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { browserStorage } from './browser-storage';

const TOKEN_KEY = 'kiko.adminToken';

/** Admin login with the shared admin password. The token is sent with REST calls and the socket handshake. */
@Service()
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly _token = signal(browserStorage.get(TOKEN_KEY));

  readonly token = this._token.asReadonly();
  readonly isAdmin = computed(() => this._token() !== null);

  async login(password: string): Promise<void> {
    const { token } = await firstValueFrom(
      this.http.post<{ token: string }>('/api/auth/admin', { password }),
    );
    this._token.set(token);
    browserStorage.set(TOKEN_KEY, token);
  }

  logout(): void {
    this._token.set(null);
    browserStorage.remove(TOKEN_KEY);
  }
}
