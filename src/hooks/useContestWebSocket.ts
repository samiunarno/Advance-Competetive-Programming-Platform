import { useEffect, useRef } from 'react';

export const useContestWebSocket = (contestId: string, onMessage: (data: any) => void) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!contestId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      // console.log('Connected to WebSocket');
      ws.current?.send(JSON.stringify({ type: 'join_contest', contestId }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    ws.current.onclose = () => {
      // console.log('Disconnected from WebSocket');
    };

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'leave_contest' }));
        ws.current.close();
      }
    };
  }, [contestId]);

  return ws.current;
};
