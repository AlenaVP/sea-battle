import { WebSocket } from 'ws';
import { db } from '../../db.js';
import { AddPlayerResult, Message } from '../../model/registration.js';

export const handleRegistration = (ws: WebSocket, message: Message) => {
  const { name, password } = JSON.parse(message.data);
  const result:AddPlayerResult = db.addPlayer(name, password);

  ws.send(JSON.stringify({
    type: 'reg',
    data: {
      name,
      index: name,
      error: result.error,
      errorText: result.errorText,
    },
    id: message.id,
  }));
};
