import { useEffect, useRef, useCallback } from 'react';
import type { WsEvent } from '../types/websocket';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { AUTH_MODE } from '../lib/oidc';

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export type WsEventHandler = (event: WsEvent) => void;

interface UseWebSocketOptions {
  sessionId: string | null;
  onEvent: WsEventHandler;
  enabled?: boolean;
}

export function useWebSocket({ sessionId, onEvent, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!sessionId || !enabledRef.current) return;

    disconnect();

    const wsBase = useSettingsStore.getState().wsBaseUrl;

    // Append the access token as a query parameter when auth is active.
    // Note: query-param tokens appear in proxy logs — use the /auth/ws-ticket
    // endpoint to get a 30-second single-use ticket for production deployments
    // where log hygiene is required.
    let url = `${wsBase}/sessions/${sessionId}`;
    if (AUTH_MODE === 'oidc') {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        url += `?token=${encodeURIComponent(token)}`;
      }
    } else if (AUTH_MODE === 'mock') {
      const user = useAuthStore.getState().user;
      // Backend doesn't validate the WS token in mock mode when AUTH_MODE=disabled
      // on the backend; no token needed.
      if (user?.name) {
        url += `?token=${encodeURIComponent(user.name)}`;
      }
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string) as WsEvent;
        onEventRef.current(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (
        enabledRef.current &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };
  }, [sessionId, disconnect]);

  useEffect(() => {
    if (sessionId && enabled) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [sessionId, enabled, connect, disconnect]);
}


const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export type WsEventHandler = (event: WsEvent) => void;

interface UseWebSocketOptions {
  sessionId: string | null;
  onEvent: WsEventHandler;
  enabled?: boolean;
}

export function useWebSocket({ sessionId, onEvent, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!sessionId || !enabledRef.current) return;

    disconnect();

    const wsBase = useSettingsStore.getState().wsBaseUrl;
    const url = `${wsBase}/sessions/${sessionId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string) as WsEvent;
        onEventRef.current(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (
        enabledRef.current &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };
  }, [sessionId, disconnect]);

  useEffect(() => {
    if (sessionId && enabled) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [sessionId, enabled, connect, disconnect]);
}
