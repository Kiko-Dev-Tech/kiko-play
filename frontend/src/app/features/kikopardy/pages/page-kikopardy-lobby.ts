import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiErrorMessage } from '../../../shared/ui/ui-error-message';
import { UiPageHeader } from '../../../shared/ui/ui-page-header';
import type { BoardSummary, GameSummary } from '../kikopardy.contract';
import { LobbyService } from '../services/lobby.service';
import { UiAdminLoginForm } from '../ui/ui-admin-login-form';
import { UiBoardList } from '../ui/ui-board-list';
import { UiGameList } from '../ui/ui-game-list';
import { UiJoinForm } from '../ui/ui-join-form';

@Component({
  selector: 'page-kikopardy-lobby',
  imports: [
    RouterLink,
    UiPageHeader,
    UiErrorMessage,
    UiJoinForm,
    UiAdminLoginForm,
    UiBoardList,
    UiGameList,
  ],
  providers: [LobbyService],
  template: `
    <ui-page-header
      title="Kikopardy"
      subtitle="Jeopardy for friends"
      backLink="/games"
      backLabel="All games"
    >
      <a routerLink="history" class="btn btn-secondary">Game history</a>
    </ui-page-header>

    <div class="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <section class="card h-fit" aria-labelledby="join-heading">
        <h2 id="join-heading" class="mb-4 text-xl font-bold">Join a game</h2>
        <ui-join-form (joined)="join($event)" />
      </section>

      <section class="card" aria-labelledby="admin-heading">
        <div class="mb-4 flex items-center justify-between gap-2">
          <h2 id="admin-heading" class="text-xl font-bold">Host</h2>
          @if (lobby.isAdmin()) {
            <button type="button" class="btn btn-ghost btn-sm" (click)="lobby.logout()">
              Log out
            </button>
          }
        </div>

        @if (!lobby.isAdmin()) {
          <p class="mb-4 text-slate-300">Log in as admin to create boards and host games.</p>
          <ui-admin-login-form
            [busy]="lobby.busy()"
            [error]="lobby.loginError()"
            (loggedIn)="lobby.login($event)"
          />
        } @else {
          <div class="flex flex-col gap-6">
            <ui-error-message
              [message]="lobby.error()"
              dismissible
              (dismissed)="lobby.clearError()"
            />

            <div>
              <h3 class="mb-2 font-semibold text-gold-300">Running games</h3>
              <ui-game-list
                [games]="lobby.runningGames()"
                emptyText="No game is running right now."
                openLabel="Resume"
                (open)="resume($event)"
              />
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between gap-2">
                <h3 class="font-semibold text-gold-300">Boards</h3>
                <a routerLink="boards/new" class="btn btn-primary btn-sm">New board</a>
              </div>
              <ui-board-list
                [boards]="lobby.boards()"
                (start)="startGame($event)"
                (edit)="editBoard($event)"
                (duplicate)="lobby.duplicateBoard($event)"
                (remove)="removeBoard($event)"
              />
            </div>
          </div>
        }
      </section>
    </div>
  `,
})
export class PageKikopardyLobby {
  protected readonly lobby = inject(LobbyService);
  private readonly router = inject(Router);

  protected join(code: string): void {
    void this.router.navigate(['/kikopardy/join', code]);
  }

  protected resume(game: GameSummary): void {
    void this.router.navigate(['/kikopardy/host', game.code]);
  }

  protected editBoard(id: string): void {
    void this.router.navigate(['/kikopardy/boards', id]);
  }

  protected async startGame(boardId: string): Promise<void> {
    const code = await this.lobby.startGame(boardId);
    if (code) {
      void this.router.navigate(['/kikopardy/host', code]);
    }
  }

  protected removeBoard(board: BoardSummary): void {
    if (confirm(`Delete the board "${board.name}"? Saved games keep their copy.`)) {
      void this.lobby.removeBoard(board.id);
    }
  }
}
