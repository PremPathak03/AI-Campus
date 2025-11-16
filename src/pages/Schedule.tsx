import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

const Schedule = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">Manage your class schedule</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No classes scheduled yet</p>
            <Button variant="outline">Import Schedule</Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Schedule;