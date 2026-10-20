import { Component, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiErrorMessage } from '../../../shared/ui/ui-error-message';
import { GameSocketService } from '../services/game-socket.service';
import { KikopardyGameService, type GameRole } from '../services/kikopardy-game.service';
import { UiBoardGrid } from '../ui/ui-board-grid';
import { UiBuzzer } from '../ui/ui-buzzer';
import { UiGameEnded } from '../ui/ui-game-ended';
import { UiGameInfoBar } from '../ui/ui-game-info-bar';
import { UiGuessForm } from '../ui/ui-guess-form';
import { UiGuessList } from '../ui/ui-guess-list';
import { UiHostControls, type HostAction } from '../ui/ui-host-controls';
import { UiQuestionView } from '../ui/ui-question-view';
import { UiScoreboard, type ScoreChange } from '../ui/ui-scoreboard';

/** A running game, for players (`/join/:code`) and the host (`/host/:code`). */
@Component({
  selector: 'page-kikopardy-game',
  imports: [
    RouterLink,
    UiErrorMessage,
    UiGameInfoBar,
    UiBoardGrid,
    UiQuestionView,
    UiBuzzer,
    UiGuessForm,
    UiGuessList,
    UiScoreboard,
    UiHostControls,
    UiGameEnded,
  ],
  providers: [GameSocketService, KikopardyGameService],
  template: `
    <ui-game-info-bar
      [boardName]="game.state()?.boardName ?? 'Kikopardy'"
      [code]="code()"
      [connected]="game.connected()"
      [showInvite]="game.isHost()"
      [showEnd]="game.isHost() && !game.ended()"
      (endGame)="endGame()"
    />

    <ui-error-message
      [message]="game.error()"
      dismissible
      (dismissed)="game.clearError()"
      class="mb-4 block"
    />

    @if (game.ended()) {
      <ui-game-ended [players]="game.state()?.players ?? []" />
    } @else if (game.state(); as state) {
      <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div class="flex flex-col gap-6">
          @if (state.current; as current) {
            <ui-question-view [current]="current" [showHiddenAnswerMedia]="game.isHost()" />
            @if (game.isGuessQuestion() && (game.isHost() || current.answerRevealed)) {
              <ui-guess-list
                [guesses]="current.guesses"
                [players]="state.players"
                [value]="current.question.points"
                [winnerId]="current.guessWinnerId"
                [canAward]="game.isHost() && !current.guessWinnerId"
                (awarded)="game.awardGuess($event)"
              />
            }
          } @else {
            @if (game.isHost()) {
              <p class="text-slate-300">Pick the next question.</p>
            }
            <ui-board-grid
              [categories]="state.categories"
              [interactive]="game.isHost()"
              (selected)="game.selectQuestion($event)"
              (unplayed)="game.setPlayed($event, false)"
            />
          }
        </div>

        <aside class="flex flex-col gap-6">
          @if (!game.isHost() && state.current; as current) {
            @if (game.isGuessQuestion()) {
              <ui-guess-form
                [open]="current.guessingOpen"
                [revealed]="current.answerRevealed"
                [submittedGuess]="game.myGuess()"
                [guessedCount]="current.guessedPlayerIds.length"
                [playerCount]="state.players.length"
                (guessed)="game.guess($event)"
              />
            } @else {
              <ui-buzzer
                [state]="game.buzzerState()"
                [buzzedName]="game.buzzedPlayer()?.name"
                (buzzed)="game.buzz()"
              />
            }
          }
          @if (game.isHost() && state.current; as current) {
            <ui-host-controls
              [current]="current"
              [buzzedPlayer]="game.buzzedPlayer()"
              [triedNames]="game.triedNames()"
              [playerCount]="state.players.length"
              (action)="onHostAction($event)"
            />
          }
          <ui-scoreboard
            [players]="state.players"
            [myId]="game.isHost() ? undefined : game.playerId"
            [buzzedPlayerId]="state.current?.buzzedPlayerId ?? null"
            [editable]="game.isHost()"
            [step]="state.current?.question?.points ?? 100"
            (scoreChanged)="setScore($event)"
          />
        </aside>
      </div>
    } @else if (!game.error()) {
      <p class="text-center text-slate-300" role="status">Connecting to the game…</p>
    } @else {
      <p class="text-center">
        <a routerLink="/kikopardy" class="btn btn-secondary">Back to lobby</a>
      </p>
    }
  `,
})
export class PageKikopardyGame {
  /** Route param. */
  readonly code = input.required<string>();
  /** Route data: whether this page is opened by a player or the host. */
  readonly role = input.required<GameRole>();

  protected readonly game = inject(KikopardyGameService);

  constructor() {
    // (Re)connect whenever the code or role in the URL changes.
    effect(() => {
      const code = this.code().toUpperCase();
      const role = this.role();
      untracked(() => this.game.connect(code, role));
    });
  }

  protected onHostAction(action: HostAction): void {
    switch (action) {
      case 'openBuzzers':
        void this.game.setBuzzersOpen(true);
        break;
      case 'lockBuzzers':
        void this.game.setBuzzersOpen(false);
        break;
      case 'openGuessing':
        void this.game.setGuessingOpen(true);
        break;
      case 'lockGuessing':
        void this.game.setGuessingOpen(false);
        break;
      case 'correct':
        void this.game.judge(true);
        break;
      case 'wrong':
        void this.game.judge(false);
        break;
      case 'unlockPlayers':
        void this.game.unlockPlayers();
        break;
      case 'skip':
        void this.game.skip();
        break;
      case 'reveal':
        void this.game.revealAnswer();
        break;
      case 'backToBoard':
        void this.game.backToBoard();
        break;
    }
  }

  protected setScore(change: ScoreChange): void {
    void this.game.setScore(change.playerId, change.score);
  }

  protected endGame(): void {
    if (confirm('End the game for everyone? The final scores are saved to the history.')) {
      void this.game.endGame();
    }
  }
}
