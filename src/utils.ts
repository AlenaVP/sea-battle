import { db } from './db.js';
import { Game } from './model/game.js';
import { Message } from './model/message.js';
import { CustomWebSocket } from './types.js';

export const sendResponse = (ws: CustomWebSocket, response: Message): void => {
  ws.send(JSON.stringify({
    type: response.type,
    data: JSON.stringify(response.data),
    id: response.id,
  }));
}

export const sendResponseToAllClients = (response: Message): void => {
  db.getAllClients().forEach(client => {
    sendResponse(client, response);
  });
}

export const sendErrorMessage = (ws: CustomWebSocket, messageId: number, errorText: string): void => {
  ws.send(JSON.stringify({ type: 'error', data: { errorText }, id: messageId }));
};

export const areAllPlayersReady = (game: Game): boolean => {
  return Object.values(game.players).every(player => player.ships.length > 0);
};
