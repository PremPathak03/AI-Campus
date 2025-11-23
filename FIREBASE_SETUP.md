# Firebase Cloud Messaging (FCM) Setup Guide

## Overview
AI Campus now integrates Firebase Cloud Messaging for push notifications. This allows you to send push notifications to users even when the app is in the background.

## Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

### 2. Register Your Web App

1. In your Firebase project, click the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "AI Campus")
3. Firebase will provide you with a configuration object

### 3. Get Your Firebase Configuration

After registering your app, you'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

### 4. Generate VAPID Key

1. In Firebase Console, go to Project Settings > Cloud Messaging
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the generated key - this is your VAPID key

### 5. Configure Environment Variables

Add the following variables to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

### 6. Update Service Worker

Edit `public/firebase-messaging-sw.js` and replace the placeholder config with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID",
  measurementId: "YOUR_ACTUAL_MEASUREMENT_ID"
};
```

### 7. Enable Cloud Messaging API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Enable the "Firebase Cloud Messaging API"

## Testing

1. Start your development server: `npm run dev`
2. Open the app and go to Settings/Profile
3. Enable notifications - this will request permission and generate an FCM token
4. The FCM token will be saved to the database in the `notification_settings` table

## Sending Test Notifications

### From Firebase Console

1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter a title and message
4. Click "Send test message"
5. Paste the FCM token from your database
6. Click "Test" to send

### From Code/Backend

You can use the Firebase Admin SDK in your backend to send notifications programmatically:

```javascript
// Example using Firebase Admin SDK
const message = {
  notification: {
    title: 'Class Reminder',
    body: 'Math 101 starts in 15 minutes'
  },
  token: userFcmToken
};

admin.messaging().send(message);
```

## Troubleshooting

### Notifications not working?

1. **Check browser permissions**: Ensure notifications are allowed in browser settings
2. **Verify FCM token**: Check if token is saved in `notification_settings` table
3. **Check service worker**: Open DevTools > Application > Service Workers
4. **Console errors**: Check browser console for Firebase-related errors
5. **VAPID key**: Ensure VAPID key is correctly set in environment variables

### Service worker not registering?

1. Make sure `firebase-messaging-sw.js` is in the `public` folder
2. Check that it's accessible at `/firebase-messaging-sw.js`
3. Service workers only work over HTTPS (except localhost)

## Security Notes

- Your Firebase API key is safe to expose in client-side code
- It's paired with your Firebase project and has restricted permissions
- Always use Firebase security rules to protect your data
- FCM tokens should be treated as sensitive and not exposed publicly

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Cloud Messaging on Web](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
