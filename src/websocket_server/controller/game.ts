import { CustomWebSocket } from '../../types.js';
import { db } from '../../db.js';
import { AddShipsToGameBoardRequest, Game, Ship, StartGameResponse } from '../../model/game.js';
import { areAllPlayersReady, sendErrorMessage, sendResponse } from '../../utils.js';

export const handleAddShips = (ws: CustomWebSocket, message: AddShipsToGameBoardRequest): void => {
  const { gameId, ships, indexPlayer } = message.data;
  const game: Game | undefined = db.getGame(gameId);

  console.log(`Handling 'add_ships' for gameId: ${gameId}, indexPlayer: ${indexPlayer}`);

  if (!game) {
    sendErrorMessage(ws, message.id, 'Game not found');
    return;
  }

  if (!game.players[indexPlayer]) {
    sendErrorMessage(ws, message.id, 'Player not found in game');
    return;
  }

  const player = game.players[indexPlayer];
  const board = player.board;

  for (const ship of ships) {
    if (!placeShipOnBoard(board, ship)) {
      sendErrorMessage(ws, message.id, 'Invalid ship placement');
      return;
    }
  }

  player.ships = ships;

  if (areAllPlayersReady(game)) {
    console.log('Update the game board if both players have placed their ships');
    updateGameBoard(String(gameId));
  }
};

const placeShipOnBoard = (board: number[][], ship: Ship): boolean => {
  const { x, y } = ship.position;
  const { direction, length } = ship;

  for (let i = 0; i < length; i++) {
    const posX = direction ? x : x + i;
    const posY = direction ? y + i : y;

    if (posX >= board.length || posY >= board[0].length || board[posX][posY] !== 0) {
      console.error(`Cannot place ship at (${posX}, ${posY}). Out of bounds or position already occupied.`);
      return false;
    }
  }

  // Place the ship on the board
  for (let i = 0; i < length; i++) {
    const posX = direction ? x : x + i;
    const posY = direction ? y + i : y;
    board[posX][posY] = 1;
  }

  return true;
};

export const updateGameBoard = (gameId: string): void => {
  const game = db.getGame(gameId);
  if (!game) {
    console.error(`Game not found for gameId: ${gameId}`);
    return;
  }

  if (areAllPlayersReady(game)) {
    console.log(`Game state before sending 'start_game': ${JSON.stringify(game)}`);
    Object.keys(game.players).forEach(playerIndex => {
      const player = game.players[playerIndex];
      const response = new StartGameResponse(player.ships, game.currentPlayerIndex);
      const client = db.getAllClients().find(c => c.playerName === playerIndex);
      if (client) {
        sendResponse(client, response);
        console.log(`Sent 'start_game' response to player: ${playerIndex}`);
      }
    });
  }
};
