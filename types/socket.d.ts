import { Socket } from 'socket.io-client';
import { PopulatedMessage } from '@/lib/messaging-service';

export interface UseSocketOptions {
  userId: string;
  onNewMessage?: (message: PopulatedMessage) => void;
  onUserStatusChange?: (data: { userId: string; status: 'online' | 'offline' }) => void;
  onTypingStart?: (data: { userId: string; chatId: string }) => void;
  onTypingStop?: (data: { userId: string; chatId: string }) => void;
  onUsersOnline?: (onlineUserIds: string[]) => void;
  onUserOnline?: (onlineUserId: string) => void;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendTypingStart: (chatId: string) => void;
  sendTypingStop: (chatId: string) => void;
} 