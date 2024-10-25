import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', function open() {
  console.log('Connected to server');
  ws.send(JSON.stringify({ type: 'reg', data: { name: 'test', password: 'test' }, id: 0 }));
});

ws.on('message', function message(data) {
  console.log('Received:', data);
});

ws.on('close', function close() {
  console.log('Disconnected from server');
});
