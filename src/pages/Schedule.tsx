import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Upload, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useSchedules,
  useClasses,
  useCreateSchedule,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  Class,
} from "@/hooks/useSchedules";
import ClassCard from "@/components/ClassCard";
import ClassForm from "@/components/ClassForm";
import ScheduleImport from "@/components/ScheduleImport";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Schedule = () => {
  const [userId, setUserId] = useState<string>();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>();
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly");

  const { data: schedules } = useSchedules(userId);
  const { data: classes } = useClasses(selectedScheduleId);
  const createSchedule = useCreateSchedule();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (schedules && schedules.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(schedules[0].id);
    }
  }, [schedules, selectedScheduleId]);

  const handleCreateSchedule = async () => {
    if (!userId) return;
    const newSchedule = await createSchedule.mutateAsync({
      name: "My Schedule",
      semester: "Spring 2024",
      user_id: userId,
    });
    setSelectedScheduleId(newSchedule.id);
  };

  const handleAddClass = async (data: any) => {
    await createClass.mutateAsync(data);
    setIsAddingClass(false);
  };

  const handleUpdateClass = async (data: any) => {
    if (!editingClass) return;
    await updateClass.mutateAsync({ ...data, id: editingClass.id });
    setEditingClass(null);
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      await deleteClass.mutateAsync(classId);
    }
  };

  const getTodayClasses = () => {
    if (!classes) return [];
    const today = DAYS_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    return classes.filter((cls) => cls.days_of_week.includes(today));
  };

  const getClassesByDay = () => {
    if (!classes) return {};
    const byDay: Record<string, Class[]> = {};
    DAYS_ORDER.forEach((day) => {
      byDay[day] = classes.filter((cls) => cls.days_of_week.includes(day));
    });
    return byDay;
  };

  if (!userId) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please log in to view your schedule</p>
        </div>
      </Layout>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <Layout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No schedule created yet</p>
            <Button onClick={handleCreateSchedule}>Create Schedule</Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const todayClasses = getTodayClasses();
  const classesByDay = getClassesByDay();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">Manage your class schedule</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImporting(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setIsAddingClass(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "daily" | "weekly")}>
          <TabsList>
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="weekly">Week</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-3">
            {todayClasses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No classes today</p>
                </CardContent>
              </Card>
            ) : (
              todayClasses.map((cls) => (
                <ClassCard
                  key={cls.id}
                  classItem={cls}
                  onEdit={setEditingClass}
                  onDelete={handleDeleteClass}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-6">
            {DAYS_ORDER.map((day) => (
              <div key={day}>
                <h3 className="font-semibold mb-3">{day}</h3>
                <div className="space-y-3">
                  {classesByDay[day]?.length === 0 ? (
                    <Card>
                      <CardContent className="py-6">
                        <p className="text-sm text-muted-foreground text-center">
                          No classes
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    classesByDay[day]?.map((cls) => (
                      <ClassCard
                        key={cls.id}
                        classItem={cls}
                        onEdit={setEditingClass}
                        onDelete={handleDeleteClass}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <Sheet open={isAddingClass} onOpenChange={setIsAddingClass}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add New Class</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {selectedScheduleId && (
                <ClassForm
                  scheduleId={selectedScheduleId}
                  onSubmit={handleAddClass}
                  onCancel={() => setIsAddingClass(false)}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Class</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {editingClass && selectedScheduleId && (
                <ClassForm
                  scheduleId={selectedScheduleId}
                  initialData={editingClass}
                  onSubmit={handleUpdateClass}
                  onCancel={() => setEditingClass(null)}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isImporting} onOpenChange={setIsImporting}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Import Schedule</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {selectedScheduleId && (
                <ScheduleImport
                  scheduleId={selectedScheduleId}
                  onComplete={() => setIsImporting(false)}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
};

export default Schedule;