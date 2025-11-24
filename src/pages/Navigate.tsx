import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Star, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useSearchRooms,
  useFavorites,
  useRecentSearches,
  useAddFavorite,
  useRemoveFavorite,
  useAddRecentSearch,
  generateDirections,
  RoomWithBuilding,
} from "@/hooks/useNavigation";
import RoomCard from "@/components/navigation/RoomCard";
import DirectionsDisplay from "@/components/navigation/DirectionsDisplay";
import { useToast } from "@/hooks/use-toast";

const Navigate = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<RoomWithBuilding | null>(null);
  const { toast } = useToast();

  const { data: searchResults = [] } = useSearchRooms(searchTerm);
  const { data: favorites = [] } = useFavorites(userId);
  const { data: recentSearches = [] } = useRecentSearches(userId);
  
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addRecentSearch = useAddRecentSearch();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });
  }, []);

  const handleNavigate = (room: RoomWithBuilding) => {
    setSelectedRoom(room);
    
    if (userId) {
      addRecentSearch.mutate({
        user_id: userId,
        room_id: room.id,
      });
    }
  };

  const handleToggleFavorite = (room: RoomWithBuilding) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to save favorites",
        variant: "destructive",
      });
      return;
    }

    const existingFavorite = favorites.find(f => f.room_id === room.id);
    
    if (existingFavorite) {
      removeFavorite.mutate(existingFavorite.id);
    } else {
      addFavorite.mutate({
        user_id: userId,
        room_id: room.id,
      });
    }
  };

  const isFavorite = (roomId: string) => {
    return favorites.some(f => f.room_id === roomId);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Campus Navigation</h1>
          <p className="text-muted-foreground">Find your way around campus</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by room number or building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Directions Display */}
        {selectedRoom && (
          <DirectionsDisplay
            room={selectedRoom}
            directions={generateDirections(selectedRoom)}
            onClose={() => setSelectedRoom(null)}
          />
        )}

        {/* Tabs */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              <MapPin className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="h-4 w-4 mr-2" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
            {searchTerm.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Search for Rooms</CardTitle>
                  <CardDescription>
                    Enter a room number or building name to find your destination
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : searchResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No rooms found matching "{searchTerm}"
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {searchResults.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onNavigate={() => handleNavigate(room)}
                    onToggleFavorite={() => handleToggleFavorite(room)}
                    isFavorite={isFavorite(room.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4 mt-4">
            {favorites.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {userId
                    ? "No favorites yet. Star locations you visit frequently!"
                    : "Please log in to save favorite locations"}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {favorites.map((favorite: any) => (
                  <RoomCard
                    key={favorite.id}
                    room={favorite.room}
                    onNavigate={() => handleNavigate(favorite.room)}
                    onToggleFavorite={() => handleToggleFavorite(favorite.room)}
                    isFavorite={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4 mt-4">
            {recentSearches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {userId
                    ? "No recent searches. Search for a room to get started!"
                    : "Please log in to see recent searches"}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {recentSearches.map((recent: any) => (
                  <RoomCard
                    key={recent.id}
                    room={recent.room}
                    onNavigate={() => handleNavigate(recent.room)}
                    onToggleFavorite={() => handleToggleFavorite(recent.room)}
                    isFavorite={isFavorite(recent.room_id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Navigate;