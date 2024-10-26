import { WebSocket } from 'ws';
import { db } from '../../db.js';
import { AddPlayerResult, Player, RegistrationRequest, RegistrationResponse } from '../../model/registration.js';

export const handleRegistration = (ws: WebSocket, message: RegistrationRequest) => {
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
      const response = new RegistrationResponse(name, name, newPlayer.error, newPlayer.errorText);
      sendResponse(ws, response);
      console.log(`New Player with name '${db.getPlayer(name)?.name}' was added!`);
    } else {
      const response = new RegistrationResponse(name, '', newPlayer.error, newPlayer.errorText);
      sendResponse(ws, response);
      console.log(`${response.data.errorText}`);
    }
  }
};

const sendResponse = (ws: WebSocket, response: RegistrationResponse): void => {
  ws.send(JSON.stringify({
    type: response.type,
    data: JSON.stringify(response.data),
    id: response.id,
  }));
}
