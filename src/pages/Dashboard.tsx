import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Compass, Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchedules, useClasses } from "@/hooks/useSchedules";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { useFirebaseMessaging } from "@/hooks/useFirebaseMessaging";
import { useClassNotifications } from "@/hooks/useClassNotifications";
import { format } from "date-fns";
import { DashboardSkeleton } from "@/components/SkeletonLoaders";
import { Capacitor } from "@capacitor/core";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const { data: schedules } = useSchedules(userId);
  const { data: classes } = useClasses(schedules?.[0]?.id);
  const { data: settings } = useNotificationSettings(userId);
  const { permission, requestPermission, scheduleClassReminder } = useNotifications();
  const { requestPermissionAndGetToken } = useFirebaseMessaging(userId);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  
  // Auto-schedule class notifications (native only)
  useClassNotifications(classes, settings);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
      
      // Extract username from user metadata or email
      const name = session.user.user_metadata?.full_name || 
                   session.user.user_metadata?.name ||
                   session.user.email?.split('@')[0] || 
                   "there";
      setUserName(name);
      
      setLoading(false);
    });
  }, [navigate]);

  // Request notification permission on first load (web only)
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    // Show banner only on web if permission is default and either settings are enabled or don't exist yet
    if (!isNative && permission === "default" && (!settings || settings.enabled)) {
      setShowNotificationBanner(true);
    }
  }, [permission, settings]);

  // Schedule notifications for today's classes
  useEffect(() => {
    if (classes && settings && permission === "granted") {
      classes.forEach((classItem) => {
        scheduleClassReminder(classItem, settings);
      });
    }
  }, [classes, settings, permission, scheduleClassReminder]);

  const handleEnableNotifications = async () => {
    setShowNotificationBanner(false);
    
    // Use Firebase Cloud Messaging to get token and enable notifications
    await requestPermissionAndGetToken();
  };

  const getNextClass = () => {
    if (!classes) return null;
    
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayClasses = classes.filter((c) => 
      c.days_of_week.includes(currentDay) && c.start_time > currentTime
    );
    
    if (todayClasses.length === 0) return null;
    
    return todayClasses.sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
  };

  const nextClass = getNextClass();

  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
        <div className="space-y-1 sm:space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground">Welcome back{userName ? `, ${userName}` : ""}!</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {showNotificationBanner && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Enable notifications to get reminders for your classes</span>
              <Button size="sm" onClick={handleEnableNotifications}>
                Enable
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {permission === "denied" && settings?.enabled && (
          <Alert variant="destructive">
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. Enable them in your browser settings to receive class reminders.
            </AlertDescription>
          </Alert>
        )}

        {nextClass && (
          <Card className="bg-primary text-primary-foreground animate-scale-in hover-scale overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Next Class</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-sm">
                Starting at {nextClass.start_time}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <p className="text-base sm:text-lg font-semibold truncate">{nextClass.course_name}</p>
                {nextClass.room_number && (
                  <p className="text-sm truncate">Room: {nextClass.room_number}</p>
                )}
                {nextClass.professor && (
                  <p className="text-sm truncate">Professor: {nextClass.professor}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
          <Card 
            className="cursor-pointer hover:bg-accent transition-all hover-scale active:scale-95 overflow-hidden"
            onClick={() => navigate("/schedule")}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px] sm:min-h-[140px]">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mb-2 text-primary transition-transform" />
              <h3 className="font-semibold text-sm sm:text-base">Schedule</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1 hidden sm:block">
                View and manage your classes
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent transition-all hover-scale active:scale-95 overflow-hidden"
            onClick={() => navigate("/chat")}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px] sm:min-h-[140px]">
              <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mb-2 text-primary transition-transform" />
              <h3 className="font-semibold text-sm sm:text-base">AI Chat</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1 hidden sm:block">
                Ask questions about campus
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent transition-all hover-scale active:scale-95 overflow-hidden col-span-2 md:col-span-1"
            onClick={() => navigate("/navigate")}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 min-h-[120px] sm:min-h-[140px]">
              <Compass className="h-10 w-10 sm:h-12 sm:w-12 mb-2 text-primary transition-transform" />
              <h3 className="font-semibold text-sm sm:text-base">Navigate</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1 hidden sm:block">
                Find your way around campus
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;