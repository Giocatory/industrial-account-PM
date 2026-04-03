'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

// Socket.IO works over HTTP/HTTPS and upgrades internally — never use ws:// here
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useChatSocket(
  projectId: string | null,
  onMessage: (msg: any) => void,
) {
  const { user } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!user) return;

    const socket = io(`${API_URL}/chat`, {
      query: { userId: user.id },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      if (projectId) socket.emit('joinProject', { projectId });
    });

    socket.on('connect_error', (err) => {
      console.warn('[Chat WS] connect error:', err.message);
    });

    socket.on('newMessage', (msg: any) => {
      onMessageRef.current(msg);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, projectId]);

  const sendMessage = useCallback(
    (content: string, recipientId?: string) => {
      const socket = socketRef.current;
      if (!socket?.connected || !user) return;
      socket.emit('sendMessage', {
        content,
        senderId: user.id,
        projectId,
        recipientId,
      });
    },
    [user?.id, projectId],
  );

  return { sendMessage };
}

export function useNotificationsSocket(onNotification: (n: any) => void) {
  const { user } = useAuthStore();
  const cbRef = useRef(onNotification);
  cbRef.current = onNotification;

  useEffect(() => {
    if (!user) return;

    const socket = io(`${API_URL}/notifications`, {
      query: { userId: user.id },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('notification', (n: any) => cbRef.current(n));
    socket.on('connect_error', (err) => {
      console.warn('[Notifications WS] connect error:', err.message);
    });

    return () => { socket.disconnect(); };
  }, [user?.id]);
}
