import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreateClass } from "@/hooks/useSchedules";

interface ScheduleImportProps {
  scheduleId: string;
  onComplete: () => void;
}

interface ParsedClass {
  course_name: string;
  course_code?: string;
  professor?: string;
  room_number?: string;
  building?: string;
  floor?: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
  notes?: string;
}

const ScheduleImport = ({ scheduleId, onComplete }: ScheduleImportProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedClasses, setParsedClasses] = useState<ParsedClass[]>([]);
  const { toast } = useToast();
  const createClass = useCreateClass();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      // Read file content
      const fileContent = await file.text();

      // Call edge function to parse schedule
      const { data, error } = await supabase.functions.invoke("parse-schedule", {
        body: {
          fileContent,
          fileName: file.name,
        },
      });

      if (error) {
        console.error("Parse error:", error);
        throw new Error(error.message || "Failed to parse schedule");
      }

      if (!data?.classes || !Array.isArray(data.classes)) {
        throw new Error("Invalid response format from parser");
      }

      setParsedClasses(data.classes);
      toast({
        title: "Schedule parsed successfully",
        description: `Found ${data.classes.length} classes`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Failed to parse schedule",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveClasses = async () => {
    setIsProcessing(true);

    try {
      for (const classData of parsedClasses) {
        await createClass.mutateAsync({
          course_name: classData.course_name,
          course_code: classData.course_code || null,
          professor: classData.professor || null,
          room_number: classData.room_number || null,
          building: classData.building || null,
          floor: classData.floor || null,
          start_time: classData.start_time,
          end_time: classData.end_time,
          days_of_week: classData.days_of_week,
          notes: classData.notes || null,
          schedule_id: scheduleId,
        });
      }

      toast({
        title: "Classes imported successfully",
        description: `Added ${parsedClasses.length} classes to your schedule`,
      });

      onComplete();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Failed to save classes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Schedule</CardTitle>
          <CardDescription>
            Upload a schedule file (TXT, CSV, or any text format) and AI will extract your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
            {isProcessing ? (
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            ) : parsedClasses.length > 0 ? (
              <CheckCircle2 className="h-12 w-12 text-accent" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {parsedClasses.length > 0
                  ? `${parsedClasses.length} classes found`
                  : "Drag and drop or click to upload"}
              </p>
              
              {parsedClasses.length === 0 && (
                <Button variant="outline" disabled={isProcessing} asChild>
                  <label>
                    Choose File
                    <input
                      type="file"
                      className="hidden"
                      accept=".txt,.csv,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                    />
                  </label>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {parsedClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {parsedClasses.map((cls, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="font-semibold">{cls.course_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {cls.days_of_week.join(", ")} • {cls.start_time} - {cls.end_time}
                  </p>
                  {(cls.building || cls.room_number) && (
                    <p className="text-sm text-muted-foreground">
                      {cls.building} {cls.room_number}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setParsedClasses([])}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveClasses}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Import ${parsedClasses.length} Classes`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleImport;