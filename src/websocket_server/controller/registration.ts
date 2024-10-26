import { CustomWebSocket } from '../../types.js';
import { db } from '../../db.js';
import {
  AddPlayerResult,
  CreateRoomRequest,
  CreateRoomResponse,
  Message,
  Player,
  RegistrationRequest,
  RegistrationResponse,
  Room,
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

  if (existingPlayer) {
    const response = new RegistrationResponse(name, name, true, 'Player already exists');
    sendResponse(ws, response);
    console.log(`${response.data.errorText} (length of players list: ${db.players.size})`);
  } else {
    const newPlayer: AddPlayerResult = db.addPlayer(name, password);

    if (!newPlayer.error) {
      ws.playerName = name;  // Store player name in WebSocket connection
      db.addClient(ws); // Add WebSocket connection to clients list

      const response = new RegistrationResponse(name, name, newPlayer.error, newPlayer.errorText);
      sendResponse(ws, response);
      console.log(`New Player with name '${db.getPlayer(name)?.name}' has been added!`);
    } else {
      const response = new RegistrationResponse(name, '', newPlayer.error, newPlayer.errorText);
      sendResponse(ws, response);
      console.log(`${response.data.errorText}`);
    }
  }
};

export const handleCreateRoom = (ws: CustomWebSocket, message: CreateRoomRequest): void => {
  const playerName = ws.playerName; // Assuming playerName is stored in WebSocket connection
  if (!playerName) {
    ws.send(JSON.stringify({ type: 'error', data: { errorText: 'Player not registered' }, id: message.id }));
    return;
  }

  const roomId = roomIdCounter++;
  const room: Room = {
    roomId: roomId.toString(),
    roomUsers: [{ name: playerName, index: playerName }], // Using playerName as index for simplicity
  };

  db.addRoom(room);
  console.log(`New Room with 'roomId'='${db.getRoom(roomId.toString())?.roomId}' has been added!`);

  const response = new CreateRoomResponse(room.roomId); // TODO: possible it doesn't need to send Response
  sendResponse(ws, response);

  // Update room state for all clients
  const updateRoomResponse = new UpdateRoomResponse(Array.from(db.rooms.values()));
  db.getAllClients().forEach(client => {
    sendResponse(client, updateRoomResponse);
  });
};

const sendResponse = (ws: CustomWebSocket, response: Message): void => {
  ws.send(JSON.stringify({
    type: response.type,
    data: JSON.stringify(response.data),
    id: response.id,
  }));
}
