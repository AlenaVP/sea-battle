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

export const isShipSunk = (board: number[][], x: number, y: number): boolean => {
  const directions = [
    { dx: 1, dy: 0 },  // Right
    { dx: -1, dy: 0 }, // Left
    { dx: 0, dy: 1 },  // Down
    { dx: 0, dy: -1 }  // Up
  ];

  for (const { dx, dy } of directions) {
    let nx = x;
    let ny = y;

    while (nx >= 0 && ny >= 0 && nx < board.length && ny < board[0].length && board[nx][ny] === 2) {
      nx += dx;
      ny += dy;
    }

    if (nx >= 0 && ny >= 0 && nx < board.length && ny < board[0].length && board[nx][ny] === 1) {
      return false; // Part of the ship is not hit
    }
  }

  return true; // All parts of the ship are hit
};

export const markSurroundingCells = (board: number[][], x: number, y: number): void => {
  const directions = [
    { dx: 1, dy: 0 },  // Right
    { dx: -1, dy: 0 }, // Left
    { dx: 0, dy: 1 },  // Down
    { dx: 0, dy: -1 }, // Up
    { dx: 1, dy: 1 },  // Down-Right
    { dx: 1, dy: -1 }, // Up-Right
    { dx: -1, dy: 1 }, // Down-Left
    { dx: -1, dy: -1 } // Up-Left
  ];

  for (const { dx, dy } of directions) {
    let nx = x + dx;
    let ny = y + dy;

    while (nx >= 0 && ny >= 0 && nx < board.length && ny < board[0].length && board[nx][ny] !== 1) {
      if (board[nx][ny] === 0) {
        board[nx][ny] = 3; // Mark as miss
      }
      nx += dx;
      ny += dy;
    }
  }
};

export const isGameOver = (board: number[][]): boolean => {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === 1) {
        return false; // There are still parts of ships that are not hit
      }
    }
  }
  return true; // All ships are sunk
};
