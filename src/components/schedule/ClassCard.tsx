import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, Pencil, Trash2 } from "lucide-react";
import { Class } from "@/hooks/useSchedules";

interface ClassCardProps {
  classItem: Class;
  onEdit: (classItem: Class) => void;
  onDelete: (classId: string) => void;
}

const ClassCard = ({ classItem, onEdit, onDelete }: ClassCardProps) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card className="hover:shadow-md transition-all hover-scale animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{classItem.course_name}</h3>
            {classItem.course_code && (
              <p className="text-sm text-muted-foreground mb-2">{classItem.course_code}</p>
            )}
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                </span>
              </div>
              
              {(classItem.building || classItem.room_number) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {classItem.building && `${classItem.building} `}
                    {classItem.room_number}
                    {classItem.floor && ` (Floor ${classItem.floor})`}
                  </span>
                </div>
              )}
              
              {classItem.professor && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{classItem.professor}</span>
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {classItem.days_of_week.map((day) => (
                <span
                  key={day}
                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                >
                  {day.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(classItem)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(classItem.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassCard;