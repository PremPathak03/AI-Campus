import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Building = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export type Room = {
  id: string;
  building_id: string;
  room_number: string;
  floor: string;
  room_type: string | null;
  description: string | null;
  created_at: string;
};

export type RoomWithBuilding = Room & {
  building: Building;
};

export type FavoriteLocation = {
  id: string;
  user_id: string;
  room_id: string;
  nickname: string | null;
  created_at: string;
};

export type RecentSearch = {
  id: string;
  user_id: string;
  room_id: string;
  searched_at: string;
};

export const useBuildings = () => {
  return useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .order("code", { ascending: true });
      
      if (error) throw error;
      return data as Building[];
    },
  });
};

export const useRooms = (buildingId?: string) => {
  return useQuery({
    queryKey: ["rooms", buildingId],
    queryFn: async () => {
      let query = supabase
        .from("rooms")
        .select("*, building:buildings(*)");
      
      if (buildingId) {
        query = query.eq("building_id", buildingId);
      }
      
      const { data, error } = await query.order("floor", { ascending: true });
      
      if (error) throw error;
      return data as RoomWithBuilding[];
    },
  });
};

export const useSearchRooms = (searchTerm: string) => {
  return useQuery({
    queryKey: ["rooms", "search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from("rooms")
        .select("*, building:buildings(*)")
        .or(`room_number.ilike.%${searchTerm}%,building.name.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (error) throw error;
      return data as RoomWithBuilding[];
    },
    enabled: searchTerm.length >= 2,
  });
};

export const useFavorites = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("favorite_locations")
        .select("*, room:rooms(*, building:buildings(*))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useRecentSearches = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["recent_searches", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("recent_searches")
        .select("*, room:rooms(*, building:buildings(*))")
        .eq("user_id", userId)
        .order("searched_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { user_id: string; room_id: string; nickname?: string }) => {
      const { data: favorite, error } = await supabase
        .from("favorite_locations")
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return favorite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({ title: "Added to favorites" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to add favorite", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from("favorite_locations")
        .delete()
        .eq("id", favoriteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({ title: "Removed from favorites" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to remove favorite", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
};

export const useAddRecentSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { user_id: string; room_id: string }) => {
      const { error } = await supabase
        .from("recent_searches")
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent_searches"] });
    },
  });
};

export const generateDirections = (room: RoomWithBuilding): string[] => {
  const directions: string[] = [];
  
  // Building location
  directions.push(`📍 Location: Building ${room.building.code} - ${room.building.name}`);
  
  if (room.building.address) {
    directions.push(`Address: ${room.building.address}`);
  }
  
  // Floor navigation
  const floorNum = parseInt(room.floor);
  if (floorNum === 1) {
    directions.push(`🚶 Enter the building on the ground floor`);
  } else {
    directions.push(`🚶 Enter the building and take the elevator or stairs to floor ${room.floor}`);
  }
  
  // Room location
  const roomNum = parseInt(room.room_number);
  if (!isNaN(roomNum)) {
    if (roomNum % 2 === 0) {
      directions.push(`➡️ Turn right - room numbers ending in even numbers are on the right corridor`);
    } else {
      directions.push(`⬅️ Turn left - room numbers ending in odd numbers are on the left corridor`);
    }
  }
  
  directions.push(`🚪 Look for Room ${room.room_number}`);
  
  if (room.room_type) {
    directions.push(`📌 Room Type: ${room.room_type}`);
  }
  
  if (room.description) {
    directions.push(`ℹ️ ${room.description}`);
  }
  
  return directions;
};
