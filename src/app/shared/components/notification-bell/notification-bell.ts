import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

/**
 * Notification bell — shows unread count badge and dropdown with recent notifications.
 * Placed in the navbar.
 */
@Component({
  selector: 'app-notification-bell',
  imports: [DatePipe],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBell implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly isOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadNotifications();
    // Poll every 30 seconds
    setInterval(() => this.loadNotifications(), 30_000);
  }

  loadNotifications(): void {
    this.api.get<Notification[]>('/notifications?limit=10').subscribe({
      next: (res: unknown) => {
        const response = res as { data: Notification[]; unreadCount: number };
        this.notifications.set(response.data ?? []);
        this.unreadCount.set(response.unreadCount ?? 0);
      },
    });
  }

  toggle(): void {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) this.loadNotifications();
  }

  close(): void {
    this.isOpen.set(false);
  }

  onClickNotification(n: Notification): void {
    if (!n.isRead) {
      this.api.put<unknown>(`/notifications/${n.id}/read`, {}).subscribe({
        next: () => {
          this.notifications.update((list) =>
            list.map((item) => item.id === n.id ? { ...item, isRead: true } : item),
          );
          this.unreadCount.update((c) => Math.max(0, c - 1));
        },
      });
    }

    if (n.referenceType && n.referenceId) {
      this.close();
      const route = this.getRoute(n.referenceType, n.referenceId);
      if (route) this.router.navigate([route]);
    }
  }

  onMarkAllRead(): void {
    this.api.put<unknown>('/notifications/read-all', {}).subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      },
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'schedule_change': return '📅';
      case 'payment_confirmed': return '💰';
      case 'enrollment_approved': return '✅';
      case 'announcement': return '📢';
      case 'match_result': return '⚽';
      default: return '🔔';
    }
  }

  private getRoute(referenceType: string, referenceId: string): string | null {
    switch (referenceType) {
      case 'tournament': return `/tournaments/${referenceId}`;
      case 'match': return `/matches/${referenceId}`;
      case 'payment': return `/payments/${referenceId}`;
      case 'announcement': return `/announcements/${referenceId}`;
      case 'team': return `/teams/${referenceId}`;
      case 'player': return `/players/${referenceId}`;
      case 'venue': return `/venues/${referenceId}`;
      default: return null;
    }
  }
}
