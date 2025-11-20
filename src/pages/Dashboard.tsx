import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageSquare, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchedules, useClasses } from "@/hooks/useSchedules";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  
  const { data: schedules } = useSchedules(userId);
  const { data: classes } = useClasses(schedules?.[0]?.id);
  const { data: settings } = useNotificationSettings(userId);
  const { scheduleClassReminder } = useNotifications();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
    });
  }, [navigate]);

  // Schedule notifications for today's classes
  useEffect(() => {
    if (classes && settings) {
      classes.forEach((classItem) => {
        scheduleClassReminder(classItem, settings);
      });
    }
  }, [classes, settings, scheduleClassReminder]);

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

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto p-4 space-y-6 pb-24">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Welcome back!</p>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        {nextClass && (
          <Card className="bg-primary text-primary-foreground">
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
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/schedule")}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Calendar className="h-12 w-12 mb-2 text-primary" />
              <h3 className="font-semibold">Schedule</h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
                View and manage your classes
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/chat")}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <MessageSquare className="h-12 w-12 mb-2 text-primary" />
              <h3 className="font-semibold">AI Chat</h3>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Ask questions about campus
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => navigate("/navigate")}
          >
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Compass className="h-12 w-12 mb-2 text-primary" />
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