import { Game, Ship } from './model/game.js';
import { AddPlayerResult, Player, Room } from './model/registration.js';
import { CustomWebSocket } from './types.js';

const clients: CustomWebSocket[] = [];
const games = new Map<string, Game>();
const players = new Map<string, Player>();
const rooms = new Map<string, Room>();

export const db = {
  players,
  rooms,
  games,

  addClient: (client: CustomWebSocket): void => {
    clients.push(client);
  },

  getAllClients: (): CustomWebSocket[] => {
    return clients;
  },

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

  // Room
  addRoom: (room: Room): void => {
    rooms.set(String(room.roomId), room);
  },

  getRoom: (id: string): Room | undefined => {
    return rooms.get(id);
  },

  removeRoom: (id: string): void => {
    rooms.delete(id);
  },

  getRoomUserListSize(room: Room): number {
    return room.roomUsers.length;
  },

  getAllRooms: (): Room[] => {
    return Array.from(rooms.values());
  },

  isRoomHasPlayer: (room: Room, playerName: string): boolean => {
    return room.roomUsers.findIndex((p) => playerName === p.name) > -1;
  },

  addPlayerToRoom: (room: Room, playerName: string): void => {
    room?.roomUsers.push({ name: playerName, index: playerName });
  },

  // Ship

  // Game
  addGame: (game: Game): void => {
    games.set(String(game.gameId), game);
  },

  getGame: (id: string | number): Game | undefined => {
    return games.get(String(id));
  },

  getAllGames: (): Game[] => {
    return Array.from(games.values());
  },
};
