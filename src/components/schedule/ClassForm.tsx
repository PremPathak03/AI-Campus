import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Class } from "@/hooks/useSchedules";

interface ClassFormProps {
  scheduleId: string;
  initialData?: Class;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const ClassForm = ({ scheduleId, initialData, onSubmit, onCancel }: ClassFormProps) => {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: initialData || {
      course_name: "",
      course_code: "",
      professor: "",
      room_number: "",
      building: "",
      floor: "",
      start_time: "",
      end_time: "",
      days_of_week: [],
      notes: "",
    },
  });

  const selectedDays = watch("days_of_week") || [];

  const toggleDay = (day: string) => {
    const current = selectedDays as string[];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setValue("days_of_week", updated);
  };

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      schedule_id: scheduleId,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="course_name">Course Name *</Label>
        <Input
          id="course_name"
          {...register("course_name", { required: true })}
          placeholder="Introduction to Computer Science"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course_code">Course Code</Label>
        <Input
          id="course_code"
          {...register("course_code")}
          placeholder="CS101"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="professor">Professor</Label>
        <Input
          id="professor"
          {...register("professor")}
          placeholder="Dr. Smith"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="building">Building</Label>
          <Input
            id="building"
            {...register("building")}
            placeholder="Science Hall"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="room_number">Room Number</Label>
          <Input
            id="room_number"
            {...register("room_number")}
            placeholder="301"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="floor">Floor</Label>
        <Input
          id="floor"
          {...register("floor")}
          placeholder="3"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time *</Label>
          <Input
            id="start_time"
            type="time"
            {...register("start_time", { required: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">End Time *</Label>
          <Input
            id="end_time"
            type="time"
            {...register("end_time", { required: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Days of Week *</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={day}
                checked={(selectedDays as string[]).includes(day)}
                onCheckedChange={() => toggleDay(day)}
              />
              <label
                htmlFor={day}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {day}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Additional notes about this class..."
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Update" : "Add"} Class
        </Button>
      </div>
    </form>
  );
};

export default ClassForm;