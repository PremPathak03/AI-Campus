import { useEffect, useState } from "react";
import { messaging, getToken, onMessage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useFirebaseMessaging = (userId: string | undefined) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const { toast } = useToast();

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Firebase Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      
      toast({
        title: payload.notification?.title || "New Notification",
        description: payload.notification?.body || "You have a new message",
      });

      // Show browser notification if permission granted
      if (permission === "granted") {
        new Notification(payload.notification?.title || "AI Campus", {
          body: payload.notification?.body,
          icon: "/placeholder.svg",
          tag: payload.data?.tag,
        });
      }
    });

    return () => unsubscribe();
  }, [messaging, permission, toast]);

  const requestPermissionAndGetToken = async () => {
    if (!messaging) {
      toast({
        title: "Firebase not initialized",
        description: "Please check your Firebase configuration",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast({
          title: "Permission denied",
          description: "Please allow notifications to receive class reminders",
          variant: "destructive",
        });
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (token) {
        console.log("FCM Token:", token);
        setFcmToken(token);

        // Store token in database
        if (userId) {
          await supabase
            .from("notification_settings")
            .upsert({
              user_id: userId,
              fcm_token: token,
              enabled: true,
              reminder_minutes: 15,
              sound_enabled: true,
              dnd_enabled: false,
            });
        }

        toast({
          title: "Notifications enabled",
          description: "You'll receive class reminders via push notifications",
        });

        return token;
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
      toast({
        title: "Error enabling notifications",
        description: error instanceof Error ? error.message : "Failed to get notification token",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    fcmToken,
    permission,
    requestPermissionAndGetToken,
  };
};
