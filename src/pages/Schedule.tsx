import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
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
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useNotifications } from "@/hooks/useNotifications";
import ClassCard from "@/components/schedule/ClassCard";
import ClassForm from "@/components/schedule/ClassForm";
import ScheduleImport from "@/components/schedule/ScheduleImport";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Schedule = () => {
  const [userId, setUserId] = useState<string>();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>();
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly");
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { data: schedules } = useSchedules(userId);
  const { data: classes } = useClasses(selectedScheduleId);
  const { data: settings } = useNotificationSettings(userId);
  const { scheduleClassReminder } = useNotifications();
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
    const newClass = await createClass.mutateAsync(data);
    if (settings) {
      scheduleClassReminder(newClass, settings);
    }
    setIsAddingClass(false);
  };

  const handleUpdateClass = async (data: any) => {
    if (!editingClass) return;
    const updatedClass = await updateClass.mutateAsync({ ...data, id: editingClass.id });
    if (settings) {
      scheduleClassReminder(updatedClass, settings);
    }
    setEditingClass(null);
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      await deleteClass.mutateAsync(classId);
    }
  };

  const handleToggleSelection = (classId: string) => {
    const newSelection = new Set(selectedClasses);
    if (newSelection.has(classId)) {
      newSelection.delete(classId);
    } else {
      newSelection.add(classId);
    }
    setSelectedClasses(newSelection);
  };

  const handleSelectAll = () => {
    if (!classes) return;
    const allClassIds = new Set(classes.map(c => c.id));
    setSelectedClasses(allClassIds);
  };

  const handleDeselectAll = () => {
    setSelectedClasses(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedClasses.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedClasses.size} selected class(es)?`)) {
      for (const classId of selectedClasses) {
        await deleteClass.mutateAsync(classId);
      }
      setSelectedClasses(new Set());
      setIsSelectionMode(false);
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
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <CalendarIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground mb-4 text-center">No schedule created yet</p>
            <Button onClick={handleCreateSchedule} size="sm">Create Schedule</Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const todayClasses = getTodayClasses();
  const classesByDay = getClassesByDay();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Schedule</h1>
            <p className="text-sm text-muted-foreground truncate">
              {isSelectionMode
                ? `${selectedClasses.size} selected`
                : "Manage your class schedule"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSelectionMode ? (
              <>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  All
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  None
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedClasses.size === 0}
                >
                  Delete ({selectedClasses.size})
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedClasses(new Set());
                }}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {classes && classes.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setIsSelectionMode(true)}>
                    Select
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setIsImporting(true)}>
                  <Upload className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
                <Button size="sm" onClick={() => setIsAddingClass(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Add Class</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "daily" | "weekly")} className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="daily" className="flex-1 sm:flex-none">Today</TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1 sm:flex-none">Week</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-2 sm:space-y-3 mt-4">
            {todayClasses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <p className="text-sm text-muted-foreground">No classes today</p>
                </CardContent>
              </Card>
            ) : (
              todayClasses.map((cls) => (
                <div key={cls.id} className="flex items-center gap-3">
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedClasses.has(cls.id)}
                      onChange={() => handleToggleSelection(cls.id)}
                      className="h-5 w-5 rounded border-gray-300"
                    />
                  )}
                  <div className="flex-1">
                    <ClassCard
                      key={cls.id}
                      classItem={cls}
                      onEdit={isSelectionMode ? undefined : setEditingClass}
                      onDelete={isSelectionMode ? undefined : handleDeleteClass}
                    />
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4 sm:space-y-6 mt-4">
            {DAYS_ORDER.map((day) => (
              <div key={day}>
                <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3">{day}</h3>
                <div className="space-y-2 sm:space-y-3">
                  {classesByDay[day]?.length === 0 ? (
                    <Card>
                      <CardContent className="py-4 sm:py-6">
                        <p className="text-xs sm:text-sm text-muted-foreground text-center">
                          No classes
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    classesByDay[day]?.map((cls) => (
                      <div key={cls.id} className="flex items-center gap-3">
                        {isSelectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedClasses.has(cls.id)}
                            onChange={() => handleToggleSelection(cls.id)}
                            className="h-5 w-5 rounded border-gray-300"
                          />
                        )}
                        <div className="flex-1">
                          <ClassCard
                            key={cls.id}
                            classItem={cls}
                            onEdit={isSelectionMode ? undefined : setEditingClass}
                            onDelete={isSelectionMode ? undefined : handleDeleteClass}
                          />
                        </div>
                      </div>
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