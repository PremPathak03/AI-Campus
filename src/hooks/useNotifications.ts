import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Class } from "./useSchedules";
import { NotificationSettings } from "./useNotificationSettings";
import { Capacitor } from "@capacitor/core";

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Only check web Notification API on web platform
    if (!isNative && "Notification" in window) {
      setPermission(Notification.permission);
    } else if (isNative) {
      // On native, assume granted (actual permission handled by native hooks)
      setPermission("granted");
    }
  }, [isNative]);

  const requestPermission = async () => {
    // Don't use web Notification API on native platform
    if (isNative) {
      toast({
        title: "Use native notifications",
        description: "Please enable notifications in Profile settings",
      });
      return false;
    }

    if (!("Notification" in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      });
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === "granted") {
      toast({
        title: "Notifications enabled",
        description: "You'll receive class reminders",
      });
      return true;
    } else {
      toast({
        title: "Notifications denied",
        description: "You won't receive class reminders",
        variant: "destructive",
      });
      return false;
    }
  };

  const scheduleClassReminder = (
    classData: Class,
    settings: NotificationSettings
  ) => {
    if (!settings.enabled || permission !== "granted") return;

    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    
    // Check if class is today
    if (!classData.days_of_week.includes(currentDay)) return;

    // Check Do Not Disturb
    if (settings.dnd_enabled && settings.dnd_start_time && settings.dnd_end_time) {
      const currentTime = now.toTimeString().slice(0, 5);
      if (currentTime >= settings.dnd_start_time && currentTime <= settings.dnd_end_time) {
        return;
      }
    }

    // Parse class start time
    const [hours, minutes] = classData.start_time.split(':').map(Number);
    const classTime = new Date(now);
    classTime.setHours(hours, minutes, 0, 0);

    // Calculate reminder time
    const reminderTime = new Date(classTime.getTime() - settings.reminder_minutes * 60000);
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder > 0 && timeUntilReminder < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        showNotification(classData, settings);
      }, timeUntilReminder);
    }
  };

  const showNotification = (classData: Class, settings: NotificationSettings) => {
    if (permission !== "granted" || isNative) return;

    const notification = new Notification(`Class Starting Soon!`, {
      body: `${classData.course_name} in ${settings.reminder_minutes} minutes\nRoom: ${classData.room_number || "TBA"}`,
      icon: "/placeholder.svg",
      badge: "/placeholder.svg",
      tag: classData.id,
      requireInteraction: true,
      silent: !settings.sound_enabled,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  const testNotification = () => {
    if (isNative) {
      toast({
        title: "Native platform",
        description: "Test notifications work automatically on native apps",
      });
      return;
    }

    if (permission !== "granted") {
      toast({
        title: "Permission required",
        description: "Please enable notifications first",
        variant: "destructive",
      });
      return;
    }

    new Notification("Test Notification", {
      body: "This is how your class reminders will look!",
      icon: "/placeholder.svg",
    });
  };

  return {
    permission,
    requestPermission,
    scheduleClassReminder,
    testNotification,
  };
};
