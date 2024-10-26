import { CustomWebSocket } from '../../types.js';
import { Message } from "../../model/registration.js";
import { handleAddUserToRoom, handleCreateRoom, handleRegistration } from "./registration.js";

export const handleMessage = (ws: CustomWebSocket, message: string) => {
  const parsedMessage: Message = JSON.parse(message);

  if (typeof parsedMessage.data === 'string' && parsedMessage.data !== '') {
    const data = JSON.parse(parsedMessage.data);
    parsedMessage.data = data;
  }

  switch (parsedMessage.type) {
    case 'reg':
      handleRegistration(ws, parsedMessage);
      break;
    case 'create_room':
      handleCreateRoom(ws, parsedMessage);
      break;
    case 'add_user_to_room':
      handleAddUserToRoom(ws, parsedMessage);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', data: { errorText: 'Unknown command' }, id: parsedMessage.id }));
  }
};
