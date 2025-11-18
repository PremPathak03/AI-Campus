import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MapPin } from "lucide-react";
import { RoomWithBuilding } from "@/hooks/useNavigation";

interface DirectionsDisplayProps {
  room: RoomWithBuilding;
  directions: string[];
  onClose: () => void;
}

const DirectionsDisplay = ({ room, directions, onClose }: DirectionsDisplayProps) => {
  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Directions to Room {room.room_number}
            </CardTitle>
            <CardDescription>
              {room.building.name} - Building {room.building.code}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {directions.map((direction, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {index + 1}
              </span>
              <p className="text-sm text-foreground pt-0.5">{direction}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};

export default DirectionsDisplay;
