import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSettings, useUpsertNotificationSettings } from "@/hooks/useNotificationSettings";
import { useNotifications } from "@/hooks/useNotifications";
import { useFirebaseMessaging } from "@/hooks/useFirebaseMessaging";
import { useToast } from "@/hooks/use-toast";
import { Bell, LogOut, User, Clock, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [userId, setUserId] = useState<string | undefined>();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const { data: settings } = useNotificationSettings(userId);
  const upsertSettings = useUpsertNotificationSettings();
  const { permission, requestPermission, testNotification } = useNotifications();
  const { requestPermissionAndGetToken } = useFirebaseMessaging(userId);

  const [enabled, setEnabled] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState("22:00");
  const [dndEnd, setDndEnd] = useState("08:00");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
      setEmail(session.user.email || "");
      
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data);
            setFullName(data.full_name || "");
          }
        });
    });
  }, [navigate]);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setReminderMinutes(settings.reminder_minutes);
      setSoundEnabled(settings.sound_enabled);
      setDndEnabled(settings.dnd_enabled);
      setDndStart(settings.dnd_start_time || "22:00");
      setDndEnd(settings.dnd_end_time || "08:00");
    }
  }, [settings]);

  const handleSaveProfile = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId);

    if (error) {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Profile updated successfully" });
    }
  };

  const handleSaveNotificationSettings = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    // If user wants to enable notifications, get FCM token
    if (enabled && permission !== "granted") {
      const token = await requestPermissionAndGetToken();
      if (!token) {
        toast({
          title: "Failed to enable notifications",
          description: "Please allow notifications in your browser settings",
          variant: "destructive",
        });
        return;
      }
    }

    // Save settings to database
    upsertSettings.mutate({
      user_id: userId,
      enabled,
      reminder_minutes: reminderMinutes,
      sound_enabled: soundEnabled,
      dnd_enabled: dndEnabled,
      dnd_start_time: dndEnabled ? dndStart : null,
      dnd_end_time: dndEnabled ? dndEnd : null,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <Layout>
      <div className="container max-w-2xl mx-auto p-4 space-y-6 pb-24 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Profile Section */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how AI Campus looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="w-full transition-all hover-scale"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="w-full transition-all hover-scale"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="w-full transition-all hover-scale"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Manage your class reminder notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders before classes
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="reminderMinutes" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Reminder Time
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="reminderMinutes"
                  type="number"
                  min="5"
                  max="60"
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  disabled={!enabled}
                />
                <span className="text-sm text-muted-foreground">minutes before class</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound with notifications
                </p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                disabled={!enabled}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Do Not Disturb
                </Label>
                <p className="text-sm text-muted-foreground">
                  Silence notifications during specific hours
                </p>
              </div>
              <Switch
                checked={dndEnabled}
                onCheckedChange={setDndEnabled}
                disabled={!enabled}
              />
            </div>

            {dndEnabled && enabled && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="dndStart">Start Time</Label>
                  <Input
                    id="dndStart"
                    type="time"
                    value={dndStart}
                    onChange={(e) => setDndStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dndEnd">End Time</Label>
                  <Input
                    id="dndEnd"
                    type="time"
                    value={dndEnd}
                    onChange={(e) => setDndEnd(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSaveNotificationSettings}>
                Save Notification Settings
              </Button>
              {permission === "granted" && (
                <Button variant="outline" onClick={testNotification}>
                  Test Notification
                </Button>
              )}
            </div>

            {permission === "denied" && (
              <p className="text-sm text-destructive">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            )}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>AI Campus v1.0.0</p>
              <p>Your intelligent campus assistant</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
