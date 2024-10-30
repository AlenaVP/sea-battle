import { CustomWebSocket } from '../../types.js';
import { db } from '../../db.js';
import { sendErrorMessage, sendResponse, sendResponseToAllClients } from '../../utils.js';
import { Game } from '../../model/game.js';
import {
  AddPlayerResult,
  AddUserToRoomRequest,
  CreateGameResponse,
  CreateRoomRequest,
  Player,
  RegistrationRequest,
  RegistrationResponse,
  Room,
  RoomUser,
  UpdateRoomResponse,
} from '../../model/registration.js';

let roomIdCounter = 1;

export const handleRegistration = (ws: CustomWebSocket, message: RegistrationRequest): void => {
  const { name, password } = message.data;

  if (!name || !password) {
    const response = new RegistrationResponse('', '', true, 'Name and password are required');
    sendResponse(ws, response);
    return;
  }

  const existingPlayer: Player | null = db.getPlayer(name);
  let response: RegistrationResponse;

  if (existingPlayer) {
    response = new RegistrationResponse(name, name, true, 'Player already exists');
    console.log(`${response.data.errorText} (length of players list: ${db.players.size})`);
  } else {
    const newPlayer: AddPlayerResult = db.addPlayer(name, password);

    if (!newPlayer.error) {
      ws.playerName = name;
      db.addClient(ws);

      response = new RegistrationResponse(name, name, newPlayer.error, newPlayer.errorText);
      console.log(`New Player with name '${db.getPlayer(name)?.name}' has been added!`);
    } else {
      response = new RegistrationResponse(name, '', newPlayer.error, newPlayer.errorText);
      console.log(`${response.data.errorText}`);
    }
  }
  sendResponse(ws, response);
};

export const handleCreateRoom = (ws: CustomWebSocket, message: CreateRoomRequest): void => {
  const playerName = ws.playerName;
  if (!playerName) {
    sendErrorMessage(ws, message.id, 'Player not registered');
    return;
  }

  const roomId = roomIdCounter++;
  const room: Room = {
    roomId: roomId.toString(),
    roomUsers: [{ name: playerName, index: playerName }],
  };

  db.addRoom(room);
  console.log(`New Room with 'roomId'='${db.getRoom(roomId.toString())?.roomId}' has been created.`);

  const response = new UpdateRoomResponse(db.getAllRooms());
  sendResponseToAllClients(response);
};

export const handleAddUserToRoom = (ws: CustomWebSocket, message: AddUserToRoomRequest) => {
  const { indexRoom } = message.data;
  const room = db.getRoom(indexRoom.toString());

  if (room) {
    const playerName = ws.playerName;
    if (!playerName) {
      sendErrorMessage(ws, message.id, 'Player not registered');
      return;
    }

    if (db.isRoomHasPlayer(room, playerName)) {
      sendErrorMessage(ws, message.id, 'Player is already in the room');
      console.log(`${playerName} is already in the room`);
      return;
    }
    db.addPlayerToRoom(room, playerName);

    if (db.getRoomUserListSize(room) === 2) {
      // Create a new game
      const gameId = room.roomId;
      const game: Game = {
        gameId,
        players: {
          [room.roomUsers[0].index]: { ships: [], board: Array(10).fill(0).map(() => Array(10).fill(0)) },
          [room.roomUsers[1].index]: { ships: [], board: Array(10).fill(0).map(() => Array(10).fill(0)) },
        },
        currentPlayerIndex: room.roomUsers[0].index,
      };

      db.addGame(game);
      console.log(`New Game with 'gameId'='${gameId}' has been created.`);

      db.removeRoom(String(room.roomId));

      room.roomUsers.forEach((user: RoomUser) => {
        const response = new CreateGameResponse(room.roomId, user.index);
        const client = db.getAllClients().find(c => c.playerName === user.name);
        if (client) {
          sendResponse(client, response);
          console.log(`${user.name}: Game has started! 🚀 `);
        }
      });
    }

    const response = new UpdateRoomResponse(db.getAllRooms());
    sendResponseToAllClients(response);
  } else {
    sendErrorMessage(ws, message.id, 'Room not found');
  }
};
