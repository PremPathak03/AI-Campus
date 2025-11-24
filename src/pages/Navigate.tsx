import { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Star, Clock } from "lucide-react";
import {
  useNavigationData,
  generateDirections,
  RoomWithBuilding,
} from "@/hooks/useNavigation";
import RoomCard from "@/components/navigation/RoomCard";
import DirectionsDisplay from "@/components/navigation/DirectionsDisplay";

const Navigate = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<RoomWithBuilding | null>(null);

  const {
    searchRooms,
    getFavoriteRooms,
    getRecentRooms,
    toggleFavorite,
    isFavorite,
    addRecentSearch,
  } = useNavigationData();

  // Memoize search results to avoid unnecessary re-renders
  const searchResults = useMemo(() => searchRooms(searchTerm), [searchTerm, searchRooms]);
  const favoriteRooms = useMemo(() => getFavoriteRooms(), [getFavoriteRooms]);
  const recentRooms = useMemo(() => getRecentRooms(), [getRecentRooms]);

  const handleNavigate = (room: RoomWithBuilding) => {
    setSelectedRoom(room);
    addRecentSearch(room.id);
  };

  const handleToggleFavorite = (room: RoomWithBuilding) => {
    toggleFavorite(room.id);
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
            placeholder="Search by room number, building, or room type..."
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
              {favoriteRooms.length > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                  {favoriteRooms.length}
                </span>
              )}
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
                    Enter a room number, building name, or room type to find your destination
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>💡 Tips:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Search by room number (e.g., "101", "202")</li>
                      <li>Search by building (e.g., "Engineering", "EB")</li>
                      <li>Search by type (e.g., "Lab", "Classroom")</li>
                    </ul>
                  </div>
                </CardContent>
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
            {favoriteRooms.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No favorites yet</p>
                  <p className="text-sm text-muted-foreground">
                    Star locations you visit frequently for quick access
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {favoriteRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onNavigate={() => handleNavigate(room)}
                    onToggleFavorite={() => handleToggleFavorite(room)}
                    isFavorite={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4 mt-4">
            {recentRooms.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No recent searches</p>
                  <p className="text-sm text-muted-foreground">
                    Your recently viewed locations will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {recentRooms.map((room) => (
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default Navigate;