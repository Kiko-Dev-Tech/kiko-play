import { Routes } from '@angular/router';
import { askUsernameGuard, usernameGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'KikoPlay',
    canActivate: [askUsernameGuard],
    loadComponent: () => import('./features/player/page-username').then((m) => m.PageUsername),
  },
  {
    path: '',
    canActivate: [usernameGuard],
    children: [
      {
        path: 'games',
        title: 'Games · KikoPlay',
        loadComponent: () =>
          import('./features/game-select/page-game-select').then((m) => m.PageGameSelect),
      },
      {
        path: 'kikopardy',
        loadChildren: () =>
          import('./features/kikopardy/kikopardy.routes').then((m) => m.kikopardyRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
