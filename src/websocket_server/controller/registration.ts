import { CustomWebSocket } from '../../types.js';
import { db } from '../../db.js';
import { Message } from '../../model/message.js';
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
    ws.send(JSON.stringify({ type: 'error', data: { errorText: 'Player not registered' }, id: message.id }));
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
      ws.send(JSON.stringify({ type: 'error', data: { errorText: 'Player not registered' }, id: message.id }));
      return;
    }

    // Add user to the room
    if (db.isRoomHasPlayer(room, playerName)) {
      ws.send(JSON.stringify({ type: 'error', data: { errorText: 'Player is already in the room' }, id: message.id }));
      console.log(`${playerName} is already in the room`);
      return;
    }
    db.addPlayerToRoom(room, playerName);

    // If the room is full, remove it from the available rooms list
    if (db.getRoomUserListSize(room) === 2) {
      db.removeRoom(String(room.roomId));

      // Notify both players that the game has started
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
    ws.send(JSON.stringify({ type: 'error', data: { errorText: 'Room not found' }, id: message.id }));
  }
};

const sendResponse = (ws: CustomWebSocket, response: Message): void => {
  ws.send(JSON.stringify({
    type: response.type,
    data: JSON.stringify(response.data),
    id: response.id,
  }));
}

const sendResponseToAllClients = (response: Message): void => {
  db.getAllClients().forEach(client => {
    sendResponse(client, response);
  });
}
