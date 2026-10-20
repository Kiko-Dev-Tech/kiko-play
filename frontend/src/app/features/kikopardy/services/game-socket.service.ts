import { DestroyRef, Service, inject } from '@angular/core';
import { io, type Socket } from 'socket.io-client';
import type { Ack } from '../kikopardy.contract';

const NOT_CONNECTED: Ack = { ok: false, error: 'Not connected to the server' };
const NO_ANSWER: Ack = { ok: false, error: 'The server did not answer' };

/**
 * One Socket.IO connection, owned by the component that provides this service.
 * Socket.IO reconnects automatically. `onConnect` runs after every (re)connect.
 */
@Service({ autoProvided: false })
export class GameSocketService {
  private socket: Socket | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.disconnect());
  }

  connect(options: {
    token: string | null;
    onConnect: () => void;
    onDisconnect: () => void;
  }): void {
    this.disconnect();
    this.socket = io({
      auth: options.token ? { token: options.token } : {},
      transports: ['websocket', 'polling'],
    });
    this.socket.on('connect', options.onConnect);
    this.socket.on('disconnect', options.onDisconnect);
  }

  on<T>(event: string, handler: (payload: T) => void): void {
    this.socket?.on(event, handler);
  }

  async emit(event: string, payload?: unknown): Promise<Ack> {
    const socket = this.socket;
    if (!socket?.connected) {
      return NOT_CONNECTED;
    }
    try {
      return (await socket.timeout(5000).emitWithAck(event, payload)) as Ack;
    } catch {
      return NO_ANSWER;
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
