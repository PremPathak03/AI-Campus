import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Check if running on native platform
const isNative = typeof window !== 'undefined' && 
  (window as any).Capacitor?.isNativePlatform?.() === true;

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | null = null;
let messaging: ReturnType<typeof getMessaging> | null = null;

try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase app initialized");
  
  // Initialize Firebase Cloud Messaging ONLY on web (not native)
  if (!isNative && typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      messaging = getMessaging(app);
      console.log("✅ Firebase Messaging initialized (web only)");
    } catch (error) {
      console.error("❌ Firebase Messaging error:", error);
    }
  } else if (isNative) {
    console.log("⚠️ Skipping Firebase Messaging on native platform (will use Capacitor Push Notifications)");
  }
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
}

export { app, messaging, getToken, onMessage };
