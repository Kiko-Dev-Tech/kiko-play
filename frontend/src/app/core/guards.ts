import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';
import { PlayerService } from './player.service';

/** Sends players without a username to the username page first, then back to where they wanted to go. */
export const usernameGuard: CanActivateFn = (_route, state) => {
  if (inject(PlayerService).hasName()) {
    return true;
  }
  return inject(Router).createUrlTree(['/'], { queryParams: { returnUrl: state.url } });
};

/** Skips the username page for players who already have a name, unless they want to change it. */
export const askUsernameGuard: CanActivateFn = (route) => {
  if (!inject(PlayerService).hasName() || route.queryParamMap.has('change')) {
    return true;
  }
  return inject(Router).parseUrl(route.queryParamMap.get('returnUrl') ?? '/games');
};

export const adminGuard: CanActivateFn = () =>
  inject(AdminAuthService).isAdmin() || inject(Router).createUrlTree(['/kikopardy']);
