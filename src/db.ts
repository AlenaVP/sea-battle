import { AddPlayerResult, Player } from './model/registration.js';

const players = new Map<string, Player>();

export const db = {
  players,

  addPlayer: (name: string, password: string): AddPlayerResult => {
    if (players.has(name)) {
      return { error: true, errorText: 'Player already exists' };
    }
    players.set(name, { name, password });
    return { error: false, errorText: '' };
  },

  getPlayer: (name: string): Player | null => {
    return players.has(name) ? players.get(name)! : null;
  },

  getAllPlayers: (): Player[] => {
    return Array.from(players.values());
  },
};
