import { useEffect, useState } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type PermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';

export const useNativePushNotifications = (userId: string | undefined) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>("prompt");
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative || !userId) return;

    // Initialize push notifications
    const initPushNotifications = async () => {
      try {
        // Check permission status
        const permStatus = await PushNotifications.checkPermissions();
        setPermission(permStatus.receive);

        // Listen for registration success
        await PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token:', token.value);
          setFcmToken(token.value);

          // Store token in database
          const { error } = await supabase
            .from("notification_settings")
            .upsert({
              user_id: userId,
              fcm_token: token.value,
              enabled: true,
              reminder_minutes: 15,
              sound_enabled: true,
              dnd_enabled: false,
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            console.error("Error saving FCM token:", error);
          }
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

        // Listen for push notifications received
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
          toast({
            title: notification.title || "New Notification",
            description: notification.body || "You have a new message",
          });
        });

        // Listen for push notification actions (user tapped notification)
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed:', notification);
        });

      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initPushNotifications();

    // Cleanup listeners on unmount
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [isNative, userId, toast]);

  const requestPermissionAndGetToken = async () => {
    if (!isNative) {
      console.log("Not a native platform, skipping native push notifications");
      return null;
    }

    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        setPermission('granted');
        
        // Register with push notification services
        await PushNotifications.register();
        
        toast({
          title: "Notifications enabled",
          description: "You'll receive class reminders via push notifications",
        });

        return fcmToken;
      } else {
        setPermission('denied');
        toast({
          title: "Permission denied",
          description: "Please allow notifications to receive class reminders",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error requesting push notification permission:", error);
      // Don't show error toast here - let the calling function handle it
      return null;
    }
  };

  return {
    fcmToken,
    permission,
    requestPermissionAndGetToken,
    isNative,
  };
};
