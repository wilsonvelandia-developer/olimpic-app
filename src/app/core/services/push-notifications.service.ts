import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { firebaseConfig, VAPID_KEY } from '../firebase/firebase.config';
import { ToastService } from '../../shared/components/toast/toast.service';
import { inject } from '@angular/core';

/**
 * Push Notifications service using Firebase Cloud Messaging (FCM).
 * Handles permission request, token retrieval, and foreground message display.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private readonly toast = inject(ToastService);
  private messaging: Messaging | null = null;

  readonly isSupported = signal<boolean>(typeof window !== 'undefined' && 'Notification' in window);
  readonly isEnabled = signal<boolean>(false);
  readonly fcmToken = signal<string | null>(null);

  constructor() {
    if (this.isSupported()) {
      this.initializeFirebase();
    }
  }

  private initializeFirebase(): void {
    try {
      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);

      // Listen for foreground messages
      onMessage(this.messaging, (payload) => {
        const title = payload.notification?.title ?? 'OlimpicApp';
        const body = payload.notification?.body ?? '';
        this.toast.info(`${title}: ${body}`);
      });
    } catch (err) {
      console.warn('Firebase messaging initialization failed:', err);
    }
  }

  /**
   * Request notification permission and get FCM token.
   * Call this after user clicks "Enable notifications".
   */
  async requestPermission(): Promise<string | null> {
    if (!this.isSupported() || !this.messaging) return null;

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.toast.warning('Permisos de notificación denegados');
        return null;
      }

      // Register the firebase-messaging-sw.js service worker
      const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      this.fcmToken.set(token);
      this.isEnabled.set(true);
      this.toast.success('Notificaciones push activadas');

      // TODO: Send token to backend to store it for this user
      // await this.api.post('/users/push-token', { token });

      return token;
    } catch (err) {
      console.error('Error getting FCM token:', err);
      this.toast.error('No se pudieron activar las notificaciones');
      return null;
    }
  }

  /**
   * Show a local notification without FCM (works offline).
   */
  showLocalNotification(title: string, body: string): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
    });
  }
}
