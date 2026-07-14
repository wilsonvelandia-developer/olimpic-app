import { Injectable, signal } from '@angular/core';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY } from '../firebase/firebase.config';

/**
 * Push notification service using Firebase Cloud Messaging.
 * Requests permission, gets FCM token, and listens for foreground messages.
 * The token should be sent to the backend to associate with the user.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private messaging: Messaging | null = null;

  readonly isSupported = signal<boolean>(false);
  readonly permissionGranted = signal<boolean>(false);
  readonly fcmToken = signal<string | null>(null);
  readonly lastMessage = signal<{ title: string; body: string } | null>(null);

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        this.isSupported.set(false);
        return;
      }
      this.isSupported.set(true);

      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);

      // Listen for foreground messages
      onMessage(this.messaging, (payload) => {
        const title = payload.notification?.title ?? 'Notificación';
        const body = payload.notification?.body ?? '';
        this.lastMessage.set({ title, body });

        // Show browser notification if page is visible
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/icons/icon-192x192.png' });
        }
      });
    } catch {
      this.isSupported.set(false);
    }
  }

  /**
   * Requests notification permission and gets the FCM token.
   * Call this after user interaction (button click).
   * @returns the FCM token or null if denied
   */
  async requestPermission(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.permissionGranted.set(false);
        return null;
      }

      this.permissionGranted.set(true);

      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(),
      });

      this.fcmToken.set(token);
      return token;
    } catch {
      return null;
    }
  }
}
