import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ExtendedWebSocket extends WebSocket {
  contestId?: string;
  isAlive: boolean;
}

let wss: WebSocketServer;

export const initWebSocket = (server: Server) => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const extWs = ws as ExtendedWebSocket;
    extWs.isAlive = true;

    extWs.on('pong', () => {
      extWs.isAlive = true;
    });

    extWs.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'join_contest') {
          extWs.contestId = data.contestId;
        } else if (data.type === 'leave_contest') {
          delete extWs.contestId;
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    });
  });

  // Heartbeat
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      if (extWs.isAlive === false) return extWs.terminate();
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
  
  console.log('WebSocket server initialized');
};

export const broadcastGlobal = (type: string, payload: any) => {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, payload }));
    }
  });
};

export const broadcastContestUpdate = (contestId: string, type: string, payload: any) => {
  if (!wss) return;

  wss.clients.forEach((client) => {
    const extClient = client as ExtendedWebSocket;
    if (extClient.readyState === WebSocket.OPEN && extClient.contestId === contestId) {
      extClient.send(JSON.stringify({ type, payload }));
    }
  });
};
