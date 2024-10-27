import { WebSocket } from 'ws';
import { Message } from "../../model/registration.js";
import { handleRegistration } from "./registration.js";

export const handleMessage = (ws: WebSocket, message: string) => {
  const parsedMessage: Message = JSON.parse(message);

  switch (parsedMessage.type) {
    case 'reg':
      handleRegistration(ws, parsedMessage);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', data: { errorText: 'Unknown command' }, id: parsedMessage.id }));
  }
};
