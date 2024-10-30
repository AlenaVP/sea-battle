import { CustomWebSocket } from '../../types.js';
import { AttackStatus } from '../../constants.js';
import { db } from '../../db.js';
import {
  AddShipsToGameBoardRequest,
  AttackRequest,
  AttackResponse,
  FinishRequest,
  Game,
  Ship,
  StartGameResponse,
  TurnRequest
} from '../../model/game.js';
import { areAllPlayersReady, isGameOver, isShipSunk, markSurroundingCells, sendErrorMessage, sendResponse } from '../../utils.js';
import { UpdateWinnersResponse } from '../../model/registration.js';

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

export const handleAttack = (ws: CustomWebSocket, message: AttackRequest): void => {
  const { gameId, x, y, indexPlayer } = message.data;
  const game: Game | undefined = db.getGame(gameId);

  if (!game) {
    sendErrorMessage(ws, message.id, 'Game not found');
    return;
  }

  if (game.currentPlayerIndex !== indexPlayer) {
    sendErrorMessage(ws, message.id, 'Not your turn');
    return;
  }

  const opponentIndex = Object.keys(game.players).find(key => key !== indexPlayer);
  if (!opponentIndex) {
    sendErrorMessage(ws, message.id, 'Opponent not found');
    return;
  }

  const opponent = game.players[opponentIndex];
  const board = opponent.board;

  if (board[x][y] === 1) {
    board[x][y] = 2;
    console.log(`Hit at (${x}, ${y}). 💣`);
    sendAttackFeedback(gameId, x, y, indexPlayer, AttackStatus.SHOT);
    if (isShipSunk(board, x, y)) {
      markSurroundingCells(board, x, y);
      console.log(`The ${opponentIndex}'s ship has been damaged. ❌`);
      sendAttackFeedback(gameId, x, y, indexPlayer, AttackStatus.KILLED);
      if (isGameOver(board)) {
        sendFinishMessage(gameId, indexPlayer);
      }
    }
  } else {
    board[x][y] = 3;
    console.log(`The ${indexPlayer} has missed. 🥛`);
    sendAttackFeedback(gameId, x, y, indexPlayer, AttackStatus.MISS);
    game.currentPlayerIndex = opponentIndex;
    sendTurnMessage(gameId, opponentIndex);
  }
};

const sendAttackFeedback = (gameId: string | number, x: number, y: number, currentPlayer: string | number, status: AttackStatus) => {
  const game = db.getGame(gameId);
  if (!game) return;

  const feedback = new AttackResponse(x, y, currentPlayer, status);

  Object.keys(game.players).forEach(playerIndex => {
    const client = db.getAllClients().find(c => c.playerName === playerIndex);
    if (client) {
      sendResponse(client, feedback);
    }
  });
};

const sendTurnMessage = (gameId: string | number, currentPlayer: string | number) => {
  const game = db.getGame(gameId);
  if (!game) return;

  const turnMessage = new TurnRequest(currentPlayer);
  console.log(`The turn goes to player: ${currentPlayer}.`);

  Object.keys(game.players).forEach(playerIndex => {
    const client = db.getAllClients().find(c => c.playerName === playerIndex);
    if (client) {
      sendResponse(client, turnMessage);
    }
  });
};

const sendFinishMessage = (gameId: string | number, winPlayer: string | number) => {
  const game = db.getGame(gameId);
  if (!game) return;

  const finishMessage = new FinishRequest(winPlayer);
  console.log(`The end. 🥇`);

  Object.keys(game.players).forEach(playerIndex => {
    const client = db.getAllClients().find(c => c.playerName === playerIndex);
    if (client) {
      sendResponse(client, finishMessage);
    }
  });

  updateWinnersTable(winPlayer);
};

const updateWinnersTable = (winPlayer: string | number) => {
  const player = db.getPlayer(String(winPlayer));
  if (!player) return;

  player.wins = (player.wins || 0) + 1;

  const winners = db.getAllPlayers().map(p => ({ name: p.name, wins: p.wins || 0 }));
  const updateWinnersResponse = new UpdateWinnersResponse(winners);

  db.getAllClients().forEach(client => {
    sendResponse(client, updateWinnersResponse);
  });
};

export const handleRandomAttack = (ws: CustomWebSocket, message:  AttackRequest): void => {
  const { gameId, indexPlayer } = message.data;
  const game: Game | undefined = db.getGame(gameId);

  if (!game) {
    sendErrorMessage(ws, message.id, 'Game not found');
    return;
  }

  const opponentIndex = Object.keys(game.players).find(key => key !== indexPlayer);
  if (!opponentIndex) {
    sendErrorMessage(ws, message.id, 'Opponent not found');
    return;
  }

  const opponent = game.players[opponentIndex];
  const board = opponent.board;

  let x, y;
  do {
    x = Math.floor(Math.random() * board.length);
    y = Math.floor(Math.random() * board[0].length);
  } while (board[x][y] === 2 || board[x][y] === 3);

  handleAttack(ws, new AttackRequest(gameId, x, y, indexPlayer));
};
