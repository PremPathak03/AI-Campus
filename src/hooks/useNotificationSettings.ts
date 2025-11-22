import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type NotificationSettings = {
  id: string;
  user_id: string;
  enabled: boolean;
  reminder_minutes: number;
  sound_enabled: boolean;
  dnd_enabled: boolean;
  dnd_start_time: string | null;
  dnd_end_time: string | null;
  created_at: string;
  updated_at: string;
};

export const useNotificationSettings = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["notification_settings", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as NotificationSettings | null;
    },
    enabled: !!userId,
  });
};

export const useUpsertNotificationSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings> & { user_id: string }) => {
      const { data, error } = await supabase
        .from("notification_settings")
        .upsert(settings)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to save settings", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
};
