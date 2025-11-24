import { useEffect, useState } from "react";
import { messaging, getToken, onMessage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

export const useFirebaseMessaging = (userId: string | undefined) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Only use web Notification API on web platform
    if (!isNative && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, [isNative]);

  // Register service worker (web only)
  useEffect(() => {
    if (!isNative && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Firebase Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, [isNative]);

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      
      toast({
        title: payload.notification?.title || "New Notification",
        description: payload.notification?.body || "You have a new message",
      });

      // Show browser notification if permission granted (web only)
      if (!isNative && permission === "granted" && "Notification" in window) {
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
      console.error("Firebase Messaging is not initialized. Check your environment variables.");
      toast({
        title: "Firebase not configured",
        description: "Please configure Firebase in your environment variables. See FIREBASE_SETUP.md",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Don't use web Notification API on native platform
      if (isNative) {
        toast({
          title: "Native platform detected",
          description: "Please use native notification settings",
        });
        return null;
      }

      // Request notification permission (web only)
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
          const { error } = await supabase
            .from("notification_settings")
            .upsert({
              user_id: userId,
              fcm_token: token,
              enabled: true,
              reminder_minutes: 15,
              sound_enabled: true,
              dnd_enabled: false,
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            console.error("Error saving FCM token:", error);
            toast({
              title: "Warning",
              description: "Notifications enabled but token not saved. You may need to enable them again.",
              variant: "destructive",
            });
          }
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
