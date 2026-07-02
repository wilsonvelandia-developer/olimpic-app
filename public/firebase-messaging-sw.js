/**
 * Firebase Messaging Service Worker.
 * Handles background push notifications when the app is not in focus.
 */
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDt0lk_BLaUMq3YWDfVEbQ63y-2AvxKUaY',
  authDomain: 'olimpicapp-b1a70.firebaseapp.com',
  projectId: 'olimpicapp-b1a70',
  storageBucket: 'olimpicapp-b1a70.firebasestorage.app',
  messagingSenderId: '751662287053',
  appId: '1:751662287053:web:ccee0c4bf0faa7c384c184',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title ?? 'OlimpicApp';
  const notificationOptions = {
    body: payload.notification?.body ?? '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
