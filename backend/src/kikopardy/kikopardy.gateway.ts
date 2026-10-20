import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service.js';
import { GameError, GameRoom } from './game-room.js';
import { GamesService } from './games.service.js';
import {
  SocketEvents,
  type Ack,
  type AwardGuessPayload,
  type GuessPayload,
  type HostPayload,
  type JoinPayload,
  type JudgePayload,
  type SelectQuestionPayload,
  type SetPlayedPayload,
  type SetScorePayload,
} from './kikopardy.contract.js';

interface SocketData {
  isAdmin: boolean;
  code?: string;
  playerId?: string;
}

type GameSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketData
>;

const playersChannel = (code: string) => `game:${code}:players`;
const adminsChannel = (code: string) => `game:${code}:admins`;
const playerChannel = (code: string, playerId: string) =>
  `game:${code}:player:${playerId}`;

@WebSocketGateway({ cors: { origin: true } })
export class KikopardyGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(KikopardyGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  constructor(
    private readonly games: GamesService,
    private readonly auth: AuthService,
  ) {}

  async handleConnection(socket: GameSocket): Promise<void> {
    const token = (socket.handshake.auth as { token?: unknown }).token;
    socket.data.isAdmin = await this.auth.isAdminToken(
      typeof token === 'string' ? token : undefined,
    );
  }

  async handleDisconnect(socket: GameSocket): Promise<void> {
    const { code, playerId } = socket.data;
    if (!code || !playerId) {
      return;
    }
    const room = await this.games.getRoom(code);
    // A player can have several tabs open. They count as connected while any tab is.
    const remaining = await this.server
      .in(playerChannel(code, playerId))
      .fetchSockets();
    if (room && remaining.length === 0) {
      room.setConnected(playerId, false);
      this.broadcast(room);
    }
  }

  // ---------- Players ----------

  @SubscribeMessage(SocketEvents.join)
  async join(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() payload: JoinPayload,
  ): Promise<Ack> {
    if (
      !isString(payload?.code) ||
      !isString(payload.playerId) ||
      !isString(payload.name)
    ) {
      return fail('Invalid request');
    }
    const room = await this.games.getRoom(payload.code);
    if (!room) {
      return fail('No running game with this code');
    }
    return this.run(room, true, async () => {
      await this.leaveCurrentGame(socket);
      room.join(payload.playerId, payload.name.slice(0, 30));
      socket.data.code = room.code;
      socket.data.playerId = payload.playerId;
      await socket.join([
        playersChannel(room.code),
        playerChannel(room.code, payload.playerId),
      ]);
    });
  }

  @SubscribeMessage(SocketEvents.buzz)
  async buzz(@ConnectedSocket() socket: GameSocket): Promise<Ack> {
    const { code, playerId } = socket.data;
    const room = code ? await this.games.getRoom(code) : undefined;
    if (!room || !playerId) {
      return fail('You are not in a game');
    }
    return this.run(room, false, () => room.buzz(playerId));
  }

  @SubscribeMessage(SocketEvents.guess)
  async guess(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() payload: GuessPayload,
  ): Promise<Ack> {
    const { code, playerId } = socket.data;
    const room = code ? await this.games.getRoom(code) : undefined;
    if (!room || !playerId) {
      return fail('You are not in a game');
    }
    if (typeof payload?.text !== 'string') {
      return fail('Invalid request');
    }
    return this.run(room, false, () => room.guess(playerId, payload.text));
  }

  // ---------- Admin ----------

  @SubscribeMessage(SocketEvents.host)
  async host(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() payload: HostPayload,
  ): Promise<Ack> {
    if (!socket.data.isAdmin) {
      return fail('Admin login required');
    }
    const room = isString(payload?.code)
      ? await this.games.getRoom(payload.code)
      : undefined;
    if (!room) {
      return fail('No running game with this code');
    }
    await this.leaveCurrentGame(socket);
    socket.data.code = room.code;
    await socket.join(adminsChannel(room.code));
    this.server.to(socket.id).emit(SocketEvents.state, room.view(true));
    return { ok: true };
  }

  @SubscribeMessage(SocketEvents.selectQuestion)
  selectQuestion(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() payload: SelectQuestionPayload,
  ) {
    return this.admin(socket, false, (room) =>
      room.selectQuestion(String(payload?.questionId)),
    );
  }

  @SubscribeMessage(SocketEvents.openBuzzers)
  openBuzzers(@ConnectedSocket() socket: GameSocket) {
    return this.admin(socket, false, (room) => room.setBuzzersOpen(true));
  }

  @SubscribeMessage(SocketEvents.lockBuzzers)
  lockBuzzers(@ConnectedSocket() socket: GameSocket) {
    return this.admin(socket, false, (room) => room.setBuzzersOpen(false));
  }

  @SubscribeMessage(SocketEvents.judge)
  judge(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() payload: JudgePayload,
  ) {
    return this.admin(socket, true, (room) =>
      room.judge(payload?.correct === true),
    );
  }

  @SubscribeMessage(SocketEvents.openGuessing)
  openGuessing(@ConnectedSocket() socket: GameSocket) {
    return this.admin(socket, false, (room) => room.setGuessingOpen(true));
  }

  @SubscribeMessage(SocketEvents.lockGuessing)
  lockGuessing(@ConnectedSocket() socket: GameSocket) {
    return this.admin(socket, false, (room) => room.setGuessingOpen(false));
  }

  @SubscribeMessage(SocketEvents.awardGuess)
  awardGuess(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() payload: AwardGuessPayload,
  ) {
    return this.admin(socket, true, (room) =>
      room.awardGuess(String(payload?.playerId)),
    );
  }

  @SubscribeMessage(SocketEvents.unlockPlayers)
  unlockPlayers(@ConnectedSocket() socket: GameSocket) {
    return this.admin(socket, false, (room) => room.unlockPlayers());
  }

  @SubscribeMessage(SocketEvents.skip)
  skip(@ConnectedSocket() socket: GameSocket) {
    return this.admin(socket, true, (room) => room.skip());
  }

  @SubscribeMessage(SocketEvents.revealAnswer)
  revealAnswer(@ConnectedSocket() socket: GameSocket) {
    return this.admin(socket, false, (room) => room.revealAnswer());
  }

  @SubscribeMessage(SocketEvents.backToBoard)
  backToBoard(@ConnectedSocket() socket: GameSocket) {
    return this.admin(socket, true, (room) => room.backToBoard());
  }

  @SubscribeMessage(SocketEvents.setScore)
  setScore(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() payload: SetScorePayload,
  ) {
    return this.admin(socket, true, (room) =>
      room.setScore(String(payload?.playerId), Number(payload?.score)),
    );
  }

  @SubscribeMessage(SocketEvents.setPlayed)
  setPlayed(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() payload: SetPlayedPayload,
  ) {
    return this.admin(socket, true, (room) =>
      room.setPlayed(String(payload?.questionId), payload?.played === true),
    );
  }

  @SubscribeMessage(SocketEvents.endGame)
  endGame(@ConnectedSocket() socket: GameSocket) {
    return this.admin(socket, true, (room) => room.end());
  }

  /** Tells everyone in a game that it is gone, e.g. after it was deleted from the history. */
  closeRoom(room: GameRoom): void {
    this.server
      .to([playersChannel(room.code), adminsChannel(room.code)])
      .emit(SocketEvents.ended);
  }

  // ---------- Helpers ----------

  private async admin(
    socket: GameSocket,
    persist: boolean,
    action: (room: GameRoom) => void,
  ): Promise<Ack> {
    const room = socket.data.code
      ? await this.games.getRoom(socket.data.code)
      : undefined;
    if (!socket.data.isAdmin || !room) {
      return fail('You are not hosting a game');
    }
    return this.run(room, persist, () => action(room));
  }

  /** Runs a game action, broadcasts the new state and saves the game if needed. */
  private async run(
    room: GameRoom,
    persist: boolean,
    action: () => void | Promise<void>,
  ): Promise<Ack> {
    try {
      await action();
    } catch (error) {
      if (error instanceof GameError) {
        return fail(error.message);
      }
      this.logger.error(error);
      return fail('Something went wrong');
    }
    this.broadcast(room);
    if (room.isFinished) {
      this.closeRoom(room);
    }
    if (persist || room.isFinished) {
      await this.games.save(room);
    }
    return { ok: true };
  }

  /** Each player gets their own view, because they may only see their own guess. */
  private broadcast(room: GameRoom): void {
    for (const playerId of room.playerIds()) {
      this.server
        .to(playerChannel(room.code, playerId))
        .emit(SocketEvents.state, room.view(false, playerId));
    }
    this.server
      .to(adminsChannel(room.code))
      .emit(SocketEvents.state, room.view(true));
  }

  private async leaveCurrentGame(socket: GameSocket): Promise<void> {
    for (const channel of socket.rooms) {
      if (channel !== socket.id) {
        await socket.leave(channel);
      }
    }
    await this.handleDisconnect(socket);
    socket.data.code = undefined;
    socket.data.playerId = undefined;
  }
}

function fail(error: string): Ack {
  return { ok: false, error };
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
