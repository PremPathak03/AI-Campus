// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyAYT6ObXDXR2j7TDeLyQOHAYDp53KVKPvE",
  authDomain: "ai-campus-83836.firebaseapp.com",
  projectId: "ai-campus-83836",
  storageBucket: "ai-campus-83836.firebasestorage.app",
  messagingSenderId: "942265549590",
  appId: "1:942265549590:web:6f968a632077b2d432c637",
  measurementId: "G-MSH1MD89G7"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'AI Campus Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.openWindow('/')
  );
});
