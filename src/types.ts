import { WebSocket } from 'ws';

export interface CustomWebSocket extends WebSocket {
  playerName?: string;
}
