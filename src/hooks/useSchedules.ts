import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Schedule = {
  id: string;
  user_id: string;
  name: string;
  semester: string | null;
  created_at: string;
  updated_at: string;
};

export type Class = {
  id: string;
  schedule_id: string;
  course_name: string;
  course_code: string | null;
  professor: string | null;
  room_number: string | null;
  building: string | null;
  floor: string | null;
  start_time: string;
  end_time: string;
  days_of_week: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const useSchedules = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["schedules", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!userId,
  });
};

export const useClasses = (scheduleId: string | undefined) => {
  return useQuery({
    queryKey: ["classes", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return [];
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("schedule_id", scheduleId)
        .order("start_time", { ascending: true });
      
      if (error) throw error;
      return data as Class[];
    },
    enabled: !!scheduleId,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { name: string; semester?: string; user_id: string }) => {
      const { data: schedule, error } = await supabase
        .from("schedules")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast({ title: "Schedule created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create schedule", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (classData: Omit<Class, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("classes")
        .insert([classData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Class added successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to add class", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...classData }: Partial<Class> & { id: string }) => {
      const { data, error } = await supabase
        .from("classes")
        .update(classData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Class updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update class", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Class deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete class", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
};