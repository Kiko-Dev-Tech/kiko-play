import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards';

export const kikopardyRoutes: Routes = [
  {
    path: '',
    title: 'Kikopardy · KikoPlay',
    loadComponent: () => import('./pages/page-kikopardy-lobby').then((m) => m.PageKikopardyLobby),
  },
  {
    path: 'join/:code',
    title: 'Kikopardy · KikoPlay',
    data: { role: 'player' },
    loadComponent: () => import('./pages/page-kikopardy-game').then((m) => m.PageKikopardyGame),
  },
  {
    path: 'host/:code',
    title: 'Hosting Kikopardy · KikoPlay',
    canActivate: [adminGuard],
    data: { role: 'host' },
    loadComponent: () => import('./pages/page-kikopardy-game').then((m) => m.PageKikopardyGame),
  },
  {
    path: 'boards/new',
    title: 'New board · Kikopardy',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/page-board-editor').then((m) => m.PageBoardEditor),
  },
  {
    path: 'boards/:id',
    title: 'Edit board · Kikopardy',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/page-board-editor').then((m) => m.PageBoardEditor),
  },
  {
    path: 'history',
    title: 'Game history · Kikopardy',
    loadComponent: () =>
      import('./pages/page-kikopardy-history').then((m) => m.PageKikopardyHistory),
  },
  {
    path: 'history/:id',
    title: 'Game details · Kikopardy',
    loadComponent: () =>
      import('./pages/page-kikopardy-game-detail').then((m) => m.PageKikopardyGameDetail),
  },
];
