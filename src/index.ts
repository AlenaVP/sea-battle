import { WebSocketServer, WebSocket } from 'ws';
import { WS_PORT } from './constants.js';

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    ws.send(`Echo: ${message}`);
  });+

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server is running on ws://localhost:${WS_PORT}`);
