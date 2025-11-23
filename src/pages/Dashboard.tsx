import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Compass, Bell, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchedules, useClasses } from "@/hooks/useSchedules";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { DashboardSkeleton } from "@/components/SkeletonLoaders";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  
  const { data: schedules } = useSchedules(userId);
  const { data: classes } = useClasses(schedules?.[0]?.id);
  const { data: settings } = useNotificationSettings(userId);
  const { permission, requestPermission, scheduleClassReminder } = useNotifications();
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
      setLoading(false);
    });
  }, [navigate]);

  // Request notification permission on first load
  useEffect(() => {
    // Show banner if permission is default and either settings are enabled or don't exist yet
    if (permission === "default" && (!settings || settings.enabled)) {
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
    const granted = await requestPermission();
    setShowNotificationBanner(false);
    
    // Create or update notification settings in database
    if (userId) {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase
        .from("notification_settings")
        .upsert({
          user_id: userId,
          enabled: granted, // Only enable if permission was granted
          reminder_minutes: 15,
          sound_enabled: true,
          dnd_enabled: false,
        })
        .select()
        .single();
    }
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
      <div className="container max-w-4xl mx-auto p-4 space-y-6 pb-24 animate-fade-in">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Welcome back!</p>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
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
          <Card className="bg-primary text-primary-foreground animate-scale-in hover-scale">
            <CardHeader>
              <CardTitle>Next Class</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Starting at {nextClass.start_time}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-semibold">{nextClass.course_name}</p>
                {nextClass.room_number && (
                  <p className="text-sm">Room: {nextClass.room_number}</p>
                )}
                {nextClass.professor && (
                  <p className="text-sm">Professor: {nextClass.professor}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className="cursor-pointer hover:bg-accent transition-all hover-scale"
            onClick={() => navigate("/schedule")}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Calendar className="h-12 w-12 mb-2 text-primary transition-transform" />
              <h3 className="font-semibold">Schedule</h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
                View and manage your classes
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent transition-all hover-scale"
            onClick={() => navigate("/chat")}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <MessageSquare className="h-12 w-12 mb-2 text-primary transition-transform" />
              <h3 className="font-semibold">AI Chat</h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Ask questions about campus
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent transition-all hover-scale"
            onClick={() => navigate("/navigate")}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Compass className="h-12 w-12 mb-2 text-primary transition-transform" />
              <h3 className="font-semibold">Navigate</h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
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