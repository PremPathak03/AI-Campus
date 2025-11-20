import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, MapPin, Star, Navigation } from "lucide-react";
import { RoomWithBuilding } from "@/hooks/useNavigation";

interface RoomCardProps {
  room: RoomWithBuilding;
  onNavigate: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

const RoomCard = ({ room, onNavigate, onToggleFavorite, isFavorite }: RoomCardProps) => {
  return (
    <Card className="hover:shadow-md transition-all hover-scale animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              {room.building.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Room {room.room_number} • Floor {room.floor}
            </CardDescription>
          </div>
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className={isFavorite ? "text-accent" : "text-muted-foreground"}
            >
              <Star className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {room.room_type && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{room.room_type}</span>
          </div>
        )}
        {room.description && (
          <p className="text-sm text-muted-foreground">{room.description}</p>
        )}
        <Button onClick={onNavigate} className="w-full hover-scale" size="sm">
          <Navigation className="h-4 w-4 mr-2" />
          Get Directions
        </Button>
      </CardContent>
    </Card>
  );
};

export default RoomCard;
