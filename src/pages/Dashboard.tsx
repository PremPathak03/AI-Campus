import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MessageSquare, Navigation } from "lucide-react";

const Dashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to AI Campus</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Next Class</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No upcoming classes</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Calendar className="h-12 w-12 mb-2 text-primary" />
              <h3 className="font-semibold">Schedule</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <MessageSquare className="h-12 w-12 mb-2 text-primary" />
              <h3 className="font-semibold">AI Chat</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Navigation className="h-12 w-12 mb-2 text-primary" />
              <h3 className="font-semibold">Navigate</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;