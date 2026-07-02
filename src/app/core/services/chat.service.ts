import { Injectable, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'tournament' | 'team' | 'direct';
  lastMessage: string | null;
  unreadCount: number;
}

/**
 * Real-time chat service via Socket.IO.
 * Supports tournament-level rooms (organizer ↔ teams) and direct messages.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly auth = inject(AuthService);
  private socket: Socket | null = null;

  readonly isConnected = signal<boolean>(false);
  readonly rooms = signal<ChatRoom[]>([]);
  readonly messages = signal<ChatMessage[]>([]);
  readonly activeRoomId = signal<string | null>(null);
  readonly unreadTotal = signal<number>(0);

  /**
   * Connects to the WebSocket server.
   * Call after authentication is confirmed.
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiBaseUrl, {
      withCredentials: true,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      this.socket?.emit('chat:join');
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
    });

    this.socket.on('chat:rooms', (data: ChatRoom[]) => {
      this.rooms.set(data);
      this.unreadTotal.set(data.reduce((sum, r) => sum + r.unreadCount, 0));
    });

    this.socket.on('chat:messages', (data: ChatMessage[]) => {
      this.messages.set(data);
    });

    this.socket.on('chat:newMessage', (msg: ChatMessage) => {
      if (msg.roomId === this.activeRoomId()) {
        this.messages.update((prev) => [...prev, msg]);
      } else {
        this.rooms.update((rooms) =>
          rooms.map((r) =>
            r.id === msg.roomId
              ? { ...r, lastMessage: msg.content, unreadCount: r.unreadCount + 1 }
              : r,
          ),
        );
        this.unreadTotal.update((n) => n + 1);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server.
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected.set(false);
  }

  /**
   * Joins a specific chat room and loads messages.
   */
  joinRoom(roomId: string): void {
    this.activeRoomId.set(roomId);
    this.messages.set([]);
    this.socket?.emit('chat:openRoom', { roomId });

    // Mark as read
    this.rooms.update((rooms) =>
      rooms.map((r) => r.id === roomId ? { ...r, unreadCount: 0 } : r),
    );
    this.recalculateUnread();
  }

  /**
   * Sends a message to the active room.
   */
  sendMessage(content: string): void {
    const roomId = this.activeRoomId();
    if (!roomId || !content.trim()) return;

    this.socket?.emit('chat:sendMessage', {
      roomId,
      content: content.trim(),
    });
  }

  /**
   * Creates a new chat room for a tournament.
   */
  createTournamentRoom(tournamentId: string, name: string): void {
    this.socket?.emit('chat:createRoom', {
      type: 'tournament',
      referenceId: tournamentId,
      name,
    });
  }

  private recalculateUnread(): void {
    this.unreadTotal.set(this.rooms().reduce((sum, r) => sum + r.unreadCount, 0));
  }
}
