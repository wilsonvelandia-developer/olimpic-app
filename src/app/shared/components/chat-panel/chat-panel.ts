import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Chat panel — displays rooms and messages for real-time communication.
 * Can be embedded as a full-page section or inside a sliding panel.
 */
@Component({
  selector: 'app-chat-panel',
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPanel implements OnInit, OnDestroy {
  readonly chat = inject(ChatService);
  private readonly auth = inject(AuthService);

  inputText = '';

  get currentUserId(): string {
    return this.auth.currentUser()?.id ?? '';
  }

  ngOnInit(): void {
    this.chat.connect();
  }

  ngOnDestroy(): void {
    this.chat.disconnect();
  }

  onSelectRoom(roomId: string): void {
    this.chat.joinRoom(roomId);
  }

  onSend(): void {
    if (!this.inputText.trim()) return;
    this.chat.sendMessage(this.inputText);
    this.inputText = '';
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
