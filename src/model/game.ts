// src/model/game.ts
import { Message } from './message.js';

export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface Game {
  gameId: number | string;
  players: {
    [key: string]: {
      ships: Ship[];
      board: number[][]; // 0 for empty, 1 for ship, 2 for hit, 3 for miss
    };
  };
  currentPlayerIndex: number | string;
}

export class AddShipsToGameBoardRequest implements Message {
  type = 'add_ships';
  data: {
    gameId: number | string,
    ships: Ship[],
    indexPlayer: number | string,
  };
  id = 0;

  constructor(gameId: number | string, ships: Ship[], indexPlayer: number | string) {
    this.data = { gameId, ships, indexPlayer };
  }
}

export class StartGameResponse implements Message {
  type = 'start_game';
  data: {
    ships: Ship[],  // player's ships, not enemy's
    currentPlayerIndex: number | string,
  };
  id = 0;

  constructor(ships: Ship[], currentPlayerIndex: number | string) {
    this.data = { ships, currentPlayerIndex };
  }
}

export class AttackFeedback implements Message {
  type = 'attack';
  data: {
    position: {
      x: number;
      y: number;
    };
    currentPlayer: number | string;
    status: 'miss' | 'killed' | 'shot';
  };
  id = 0;

  constructor(x: number, y: number, currentPlayer: number | string, status: 'miss' | 'killed' | 'shot') {
    this.data = {
      position: { x, y },
      currentPlayer,
      status,
    };
  }
}

export class TurnInfo implements Message {
  type = 'turn';
  data: {
    currentPlayer: number | string;
  };
  id = 0;

  constructor(currentPlayer: number | string) {
    this.data = { currentPlayer };
  }
}

export class FinishGame implements Message {
  type = 'finish';
  data: {
    winPlayer: number | string;
  };
  id = 0;

  constructor(winPlayer: number | string) {
    this.data = { winPlayer };
  }
}
