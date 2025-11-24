import { useState, useEffect, useMemo } from "react";
import navigationData from "@/data/navigation-data.json";

export type Building = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type Room = {
  id: string;
  building_id: string;
  room_number: string;
  floor: string;
  room_type: string | null;
  description: string | null;
};

export type RoomWithBuilding = Room & {
  building: Building;
};

const FAVORITES_KEY = "navigation_favorites";
const RECENT_SEARCHES_KEY = "navigation_recent";

// Helper function to get rooms with their building info
const getRoomsWithBuildings = (): RoomWithBuilding[] => {
  return navigationData.rooms.map((room) => {
    const building = navigationData.buildings.find((b) => b.id === room.building_id);
    return {
      ...room,
      building: building!,
    };
  });
};

// Local storage helpers
const getLocalStorageItem = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalStorageItem = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

export const useNavigationData = () => {
  const [favorites, setFavorites] = useState<string[]>(() =>
    getLocalStorageItem<string[]>(FAVORITES_KEY, [])
  );
  const [recentSearches, setRecentSearches] = useState<
    Array<{ roomId: string; timestamp: number }>
  >(() => getLocalStorageItem(RECENT_SEARCHES_KEY, []));

  const allRooms = useMemo(() => getRoomsWithBuildings(), []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    setLocalStorageItem(FAVORITES_KEY, favorites);
  }, [favorites]);

  // Save to localStorage whenever recent searches change
  useEffect(() => {
    setLocalStorageItem(RECENT_SEARCHES_KEY, recentSearches);
  }, [recentSearches]);

  const searchRooms = (searchTerm: string): RoomWithBuilding[] => {
    if (!searchTerm || searchTerm.length < 2) return [];

    const term = searchTerm.toLowerCase();
    return allRooms
      .filter(
        (room) =>
          room.room_number.toLowerCase().includes(term) ||
          room.building.name.toLowerCase().includes(term) ||
          room.building.code.toLowerCase().includes(term) ||
          room.room_type?.toLowerCase().includes(term) ||
          room.description?.toLowerCase().includes(term)
      )
      .slice(0, 10);
  };

  const getFavoriteRooms = (): RoomWithBuilding[] => {
    return favorites
      .map((roomId) => allRooms.find((room) => room.id === roomId))
      .filter((room): room is RoomWithBuilding => room !== undefined);
  };

  const getRecentRooms = (): RoomWithBuilding[] => {
    return recentSearches
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((recent) => allRooms.find((room) => room.id === recent.roomId))
      .filter((room): room is RoomWithBuilding => room !== undefined);
  };

  const toggleFavorite = (roomId: string): void => {
    setFavorites((prev) => {
      if (prev.includes(roomId)) {
        return prev.filter((id) => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  const isFavorite = (roomId: string): boolean => {
    return favorites.includes(roomId);
  };

  const addRecentSearch = (roomId: string): void => {
    setRecentSearches((prev) => {
      // Remove existing entry for this room if it exists
      const filtered = prev.filter((item) => item.roomId !== roomId);
      // Add new entry at the beginning
      return [{ roomId, timestamp: Date.now() }, ...filtered].slice(0, 10);
    });
  };

  return {
    allRooms,
    searchRooms,
    getFavoriteRooms,
    getRecentRooms,
    toggleFavorite,
    isFavorite,
    addRecentSearch,
    favorites,
    recentSearches,
  };
};

export const generateDirections = (room: RoomWithBuilding): string[] => {
  const directions: string[] = [];

  // Building location
  directions.push(
    `📍 Location: Building ${room.building.code} - ${room.building.name}`
  );

  if (room.building.address) {
    directions.push(`Address: ${room.building.address}`);
  }

  // Floor navigation
  const floorNum = parseInt(room.floor);
  if (floorNum === 1) {
    directions.push(`🚶 Enter the building on the ground floor`);
  } else {
    directions.push(
      `🚶 Enter the building and take the elevator or stairs to floor ${room.floor}`
    );
  }

  // Room location
  const roomNum = parseInt(room.room_number);
  if (!isNaN(roomNum)) {
    if (roomNum % 2 === 0) {
      directions.push(
        `➡️ Turn right - room numbers ending in even numbers are on the right corridor`
      );
    } else {
      directions.push(
        `⬅️ Turn left - room numbers ending in odd numbers are on the left corridor`
      );
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
