import { httpServer } from './http_server/index.js';
import { WebSocketServer, WebSocket, RawData } from 'ws';

import { HTTP_PORT, WS_PORT } from './constants.js';
import { handleMessage } from './websocket_server/controller/controller.js';

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  ws.on('message', (message: RawData) => {
    console.log(`Received message: ${message}`);
    try {
      const parsedMessage = JSON.parse(message.toString());
      handleMessage(ws, JSON.stringify(parsedMessage));
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { errorText: 'Invalid JSON format' },
        id: 0,
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket (server) error:', error);
  });
});

console.log(`WebSocket server is running on ws://localhost:${WS_PORT}`);
