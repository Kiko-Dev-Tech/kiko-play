import { Service, computed, inject, signal } from '@angular/core';
import { AdminAuthService } from '../../../core/admin-auth.service';
import { PlayerService } from '../../../core/player.service';
import { SocketEvents, type Ack, type GameView } from '../kikopardy.contract';
import { GameSocketService } from './game-socket.service';

export type GameRole = 'player' | 'host';
export type BuzzerState = 'waiting' | 'open' | 'tried' | 'me' | 'other';

/** Live state of one Kikopardy game and all actions players and the host can take. */
@Service({ autoProvided: false })
export class KikopardyGameService {
  private readonly socket = inject(GameSocketService);
  private readonly player = inject(PlayerService);
  private readonly auth = inject(AdminAuthService);

  private readonly _state = signal<GameView | null>(null);
  private readonly _connected = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _ended = signal(false);
  private readonly _role = signal<GameRole>('player');

  readonly state = this._state.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly error = this._error.asReadonly();
  readonly ended = this._ended.asReadonly();
  readonly isHost = computed(() => this._role() === 'host');
  readonly playerId = this.player.id;

  readonly current = computed(() => this._state()?.current ?? null);
  readonly buzzedPlayer = computed(() => {
    const id = this.current()?.buzzedPlayerId;
    return this._state()?.players.find((p) => p.id === id) ?? null;
  });
  readonly buzzerState = computed<BuzzerState>(() => {
    const current = this.current();
    if (!current || current.answerRevealed) {
      return 'waiting';
    }
    if (current.buzzedPlayerId) {
      return current.buzzedPlayerId === this.player.id ? 'me' : 'other';
    }
    if (current.triedPlayerIds.includes(this.player.id)) {
      return 'tried';
    }
    return current.buzzersOpen ? 'open' : 'waiting';
  });
  readonly isGuessQuestion = computed(() => this.current()?.question.type === 'guess');
  readonly myGuess = computed(
    () => this.current()?.guesses.find((g) => g.playerId === this.player.id)?.text ?? '',
  );
  readonly triedNames = computed(() => {
    const tried = this.current()?.triedPlayerIds ?? [];
    return (this._state()?.players ?? []).filter((p) => tried.includes(p.id)).map((p) => p.name);
  });

  /** Connects to a game. Joining or hosting is repeated automatically after every reconnect. */
  connect(code: string, role: GameRole): void {
    this._role.set(role);
    this._state.set(null);
    this._ended.set(false);
    this._error.set(null);
    this.socket.connect({
      token: role === 'host' ? this.auth.token() : null,
      onConnect: () => {
        this._connected.set(true);
        void this.enter(code);
      },
      onDisconnect: () => this._connected.set(false),
    });
    this.socket.on<GameView>(SocketEvents.state, (state) => this._state.set(state));
    this.socket.on(SocketEvents.ended, () => this._ended.set(true));
  }

  clearError(): void {
    this._error.set(null);
  }

  // ---------- Player ----------

  buzz() {
    return this.send(SocketEvents.buzz);
  }

  /** Submits or changes the own guess. An empty text withdraws it. */
  guess(text: string) {
    return this.send(SocketEvents.guess, { text });
  }

  // ---------- Host ----------

  selectQuestion(questionId: string) {
    return this.send(SocketEvents.selectQuestion, { questionId });
  }

  setBuzzersOpen(open: boolean) {
    return this.send(open ? SocketEvents.openBuzzers : SocketEvents.lockBuzzers);
  }

  judge(correct: boolean) {
    return this.send(SocketEvents.judge, { correct });
  }

  setGuessingOpen(open: boolean) {
    return this.send(open ? SocketEvents.openGuessing : SocketEvents.lockGuessing);
  }

  awardGuess(playerId: string) {
    return this.send(SocketEvents.awardGuess, { playerId });
  }

  unlockPlayers() {
    return this.send(SocketEvents.unlockPlayers);
  }

  skip() {
    return this.send(SocketEvents.skip);
  }

  revealAnswer() {
    return this.send(SocketEvents.revealAnswer);
  }

  backToBoard() {
    return this.send(SocketEvents.backToBoard);
  }

  setScore(playerId: string, score: number) {
    return this.send(SocketEvents.setScore, { playerId, score });
  }

  setPlayed(questionId: string, played: boolean) {
    return this.send(SocketEvents.setPlayed, { questionId, played });
  }

  endGame() {
    return this.send(SocketEvents.endGame);
  }

  // ---------- Helpers ----------

  private async enter(code: string): Promise<void> {
    const ack = this.isHost()
      ? await this.socket.emit(SocketEvents.host, { code })
      : await this.socket.emit(SocketEvents.join, {
          code,
          playerId: this.player.id,
          name: this.player.name(),
        });
    this.handleAck(ack);
  }

  private async send(event: string, payload?: unknown): Promise<boolean> {
    return this.handleAck(await this.socket.emit(event, payload));
  }

  private handleAck(ack: Ack): boolean {
    this._error.set(ack.ok ? null : ack.error);
    return ack.ok;
  }
}
