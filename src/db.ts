import { WebSocket } from 'ws';

import { AddPlayerResult, Player, Room } from './model/registration.js';
import { CustomWebSocket } from './types.js';

const clients: WebSocket[] = [];
const players = new Map<string, Player>();
const rooms = new Map<string, Room>();
const availableRooms = new Map<string, Room>();

export const db = {
  players,
  rooms,

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
    if (room.roomUsers.length < 2) {
      availableRooms.set(String(room.roomId), room);
    }
  },

  getRoom: (id: string): Room | undefined => {
    return rooms.get(id);
  },

  removeRoom: (id: string): void => {
    rooms.delete(id);
    availableRooms.delete(id);
  },

  removeRoomFromAvailables: (id: string): void => {
    availableRooms.delete(id);
  },

  getRoomUserListSize(room: Room): number {
    return room.roomUsers.length;
  },

  getAllRooms: (): Room[] => {
    return Array.from(rooms.values());
  },

  getAllAvailableRooms: (): Room[] => {
    return Array.from(availableRooms.values());
  },

  addPlayerToRoom: (room: Room, playerName: string): void => {
    room?.roomUsers.push({ name: playerName, index: playerName });
  },
};
