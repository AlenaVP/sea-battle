import { CustomWebSocket } from '../../types.js';
import { Message } from '../../model/message.js';
import { handleAddShips, updateGameBoard } from './game.js';
import { handleAddUserToRoom, handleCreateRoom, handleRegistration } from './registration.js';

export const handleMessage = (ws: CustomWebSocket, message: string) => {
  const parsedMessage: Message = JSON.parse(message);

  if (typeof parsedMessage.data === 'string' && parsedMessage.data !== '') {
    const data = JSON.parse(parsedMessage.data);
    parsedMessage.data = data;
  }

  try {
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
      case 'start_game':
        console.log('Game started. gameId=', parsedMessage.data.gameId);
        updateGameBoard(parsedMessage.data.gameId);
        break;
      case 'add_ships':
        handleAddShips(ws, parsedMessage);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', data: { errorText: 'Unknown command' }, id: parsedMessage.id }));
    }
  } catch (error: any) {
    console.error('[controller] Error handling message:', error);
    ws.send(JSON.stringify({ type: 'error', data: { errorText: error.message }, id: parsedMessage.id }));
  }
};
