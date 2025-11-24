import { useEffect } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { Class } from "./useSchedules";
import { NotificationSettings } from "./useNotificationSettings";
import { useToast } from "./use-toast";

export const useClassNotifications = (
  classes: Class[] | undefined,
  settings: NotificationSettings | undefined
) => {
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Only run on native platform
    if (!isNative) return;
    
    // Check if we have data and notifications are enabled
    if (!classes || !settings || !settings.enabled) return;

    const scheduleNotifications = async () => {
      try {
        const permission = await LocalNotifications.requestPermissions();
        
        if (permission.display !== 'granted') {
          toast({
            title: "Notification Permission Required",
            description: "Please enable notifications in your device settings",
            variant: "destructive"
          });
          return;
        }

        // Cancel all existing notifications
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({ 
            notifications: pending.notifications.map(n => ({ id: n.id })) 
          });
        }

        const now = new Date();
        const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
        const currentTime = now.toTimeString().slice(0, 5);
        const notifications: any[] = [];

        classes.forEach((classItem) => {
          // Check if class is today
          if (!classItem.days_of_week.includes(currentDay)) return;

          // Check Do Not Disturb
          if (settings.dnd_enabled && settings.dnd_start_time && settings.dnd_end_time) {
            if (currentTime >= settings.dnd_start_time && currentTime <= settings.dnd_end_time) {
              return;
            }
          }

          // Parse class start time
          const [hours, minutes] = classItem.start_time.split(':').map(Number);
          const classTime = new Date(now);
          classTime.setHours(hours, minutes, 0, 0);

          // Calculate reminder time
          const reminderTime = new Date(classTime.getTime() - settings.reminder_minutes * 60000);

          // Only schedule if reminder is in the future and within 24 hours
          if (reminderTime > now && reminderTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
            const notificationId = Math.abs(classItem.id.split('').reduce((acc, char) => 
              acc + char.charCodeAt(0), 0) % 2147483647);
            
            notifications.push({
              title: "🔔 Class Starting Soon!",
              body: `${classItem.course_name} starts in ${settings.reminder_minutes} minutes${classItem.room_number ? `\nRoom: ${classItem.room_number}` : ''}`,
              id: notificationId,
              schedule: { at: reminderTime },
              sound: settings.sound_enabled ? undefined : null,
              attachments: undefined,
              actionTypeId: "",
              extra: {
                classId: classItem.id,
                className: classItem.course_name,
              }
            });
          }
        });

        if (notifications.length > 0) {
          await LocalNotifications.schedule({ notifications });
          toast({
            title: "Class Reminders Set",
            description: `${notifications.length} reminder(s) scheduled for today`,
          });
        }
      } catch (error) {
        console.error("Error scheduling notifications:", error);
      }
    };

    scheduleNotifications();

    // Re-schedule every hour to catch new classes
    const interval = setInterval(scheduleNotifications, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [classes, settings, isNative, toast]);

  const scheduleManualTest = async () => {
    if (!isNative) return;

    try {
      await LocalNotifications.schedule({
        notifications: [{
          title: "🔔 Test Class Reminder",
          body: "Computer Science 101 starts in 15 minutes\nRoom: A-204",
          id: 999,
          schedule: { at: new Date(Date.now() + 2000) }, // 2 seconds
        }]
      });
      toast({ title: "Test notification scheduled for 2 seconds" });
    } catch (error) {
      console.error("Error scheduling test:", error);
    }
  };

  return { scheduleManualTest };
};
